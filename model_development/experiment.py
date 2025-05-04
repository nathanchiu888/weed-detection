"""
Inference script for running the optimized weed detection model on Raspberry Pi.
Supports both PyTorch quantized models and ONNX models.

Run with:

To run random validation samples:
python model_development/experiment.py --model-path model_development/optimized_models/model.onnx --data-dir model_development/data --num-samples 5

OR

To run a specific image:
python model_development/experiment.py --model-path model_development/optimized_models/model.onnx --image model_development/data/Broadleafs/43205669.jpg

"""

import os
import time
import argparse
import torch
import numpy as np
import random
from PIL import Image
import torchvision.transforms as transforms
import matplotlib.pyplot as plt
from models.tinyresvit import TinyResViT
from data.dataset import WeedDataset
from torch.utils.data import DataLoader
import onnxruntime


def preprocess_image(image_path, size=224):
    """Preprocess an image for model input"""

    img = Image.open(image_path).convert('RGB')
    
    # Apply preprocessing
    preprocess = transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # add batch dimension
    img_tensor = preprocess(img).unsqueeze(0)
    return img_tensor


# def load_pytorch_model(model_path):
#     """Load a quantized PyTorch model"""
#     model = TinyResViT(num_classes=2)
    
#     checkpoint = torch.load(model_path, map_location='cpu')
#     if 'model_state_dict' in checkpoint:
#         model.load_state_dict(checkpoint['model_state_dict'])
#     else:
#         model.load_state_dict(checkpoint)
    
#     model.eval()
#     return model


# def inference_pytorch(model, image_tensor):
#     """Run inference using PyTorch model"""
#     with torch.no_grad():
#         start_time = time.time()
#         outputs = model(image_tensor)
#         inference_time = (time.time() - start_time) * 1000
    
#     probabilities = torch.nn.functional.softmax(outputs, dim=1)
#     confidence, predicted_class = torch.max(probabilities, 1)
    
#     return predicted_class.item(), confidence.item(), inference_time


def inference_onnx(session, image_tensor):
    """Run inference using ONNX model"""
    
    # Prepare input
    input_name = session.get_inputs()[0].name
    numpy_image = image_tensor.numpy()
    
    # Run inference
    start_time = time.time()
    outputs = session.run(None, {input_name: numpy_image})
    inference_time = (time.time() - start_time) * 1000  # ms
    
    # Process output
    scores = outputs[0][0]
    probabilities = np.exp(scores) / np.sum(np.exp(scores))  # softmax
    predicted_class = np.argmax(probabilities)
    confidence = probabilities[predicted_class]
    
    return predicted_class, confidence, inference_time, probabilities


def display_image_with_prediction(image, true_label, pred_label, confidence, class_names):
    """Display an image with its prediction"""
    # Convert image for display
    img = image.squeeze(0).cpu()
    # Denormalize
    mean = torch.tensor([0.485, 0.456, 0.406]).reshape(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).reshape(3, 1, 1)
    img = img * std + mean
    img = img.permute(1, 2, 0).numpy()
    img = np.clip(img, 0, 1)
    
    # Create figure
    plt.figure(figsize=(8, 8))
    plt.imshow(img)
    
    # Set color based on correctness
    color = 'green' if true_label == pred_label else 'red'
    
    plt.title(f"True: {class_names[true_label]}, Predicted: {class_names[pred_label]} ({confidence*100:.1f}%)", 
              color=color, fontsize=14)
    plt.axis('off')
    plt.tight_layout()
    plt.show()


def run_validation_samples(model_path, data_dir='data', num_samples=5):
    """Run inference on random samples from validation set"""
    class_names = {0: 'Broadleaf', 1: 'Grass'}
    
    # validation dataset
    print(f"Loading validation dataset from {data_dir}...")
    val_dataset = WeedDataset(data_dir, split='val')
    
    # Get random indices for sampling
    random_indices = random.sample(range(len(val_dataset)), min(num_samples, len(val_dataset)))
    
    # Load ONNX
    if model_path.endswith('.onnx'):
        print(f"Loading ONNX model from {model_path}...")
        session = onnxruntime.InferenceSession(model_path)
        use_onnx = True
    else:
        print("Invalid model path. Please provide a valid ONNX model path.")
        return
        # print(f"Loading PyTorch model from {model_path}...")
        # model = load_pytorch_model(model_path)
        # use_onnx = False
    
    # Process each sample
    total_time = 0
    total_correct = 0
    
    print(f"\nRunning inference on {num_samples} random validation samples:")
    for idx in random_indices:
        # sample
        image, label = val_dataset[idx]
        image = image.unsqueeze(0)  # Add batch dimension
        
        # inference
        if use_onnx:
            pred_class, confidence, inf_time, probabilities = inference_onnx(session, image)
            probs_str = ", ".join([f"{class_names[i]}: {prob:.4f}" for i, prob in enumerate(probabilities)])
        else:
            pred_class, confidence, inf_time = inference_pytorch(model, image)
            probs_str = f"{class_names[pred_class]}: {confidence:.4f}"
        
        total_time += inf_time
        total_correct += (pred_class == label)
        
        # Display results
        print(f"\nSample {idx}:")
        print(f"True class: {class_names[label]}")
        print(f"Predicted class: {class_names[pred_class]} (confidence: {confidence:.4f})")
        print(f"Class probabilities: {probs_str}")
        print(f"Inference time: {inf_time:.2f} ms")
        
        # Display image
        display_image_with_prediction(image, label, pred_class, confidence, class_names)
    
    print("\nSummary:")
    print(f"Average inference time: {total_time/num_samples:.2f} ms")
    print(f"Accuracy avg: {total_correct/num_samples:.2f} ({total_correct}/{num_samples})")
    print(f"Est img/sec: {1000/(total_time/num_samples):.1f} images/sec")


def main():
    parser = argparse.ArgumentParser(description='Run inference with optimized weed detection models')
    parser.add_argument('--model-path', type=str, 
                        default='optimized_models/model.onnx',
                        help='Path to the model file')
    parser.add_argument('--data-dir', type=str, default='data',
                        help='Path to data directory containing validation images')
    parser.add_argument('--num-samples', type=int, default=5,
                        help='Number of random validation samples to process')
    parser.add_argument('--image', type=str,
                        help='Optional: Path to a specific image to process')
    args = parser.parse_args()
    
    if args.image:
        # Process a single image if specified
        image_tensor = preprocess_image(args.image)
        
        class_names = {0: 'Broadleaf', 1: 'Grass'}
        
        if args.model_path.endswith('.onnx'):
            session = onnxruntime.InferenceSession(args.model_path)
            predicted_class, confidence, inference_time, _ = inference_onnx(session, image_tensor)
        else:
            print("Invalid model path. Please provide a valid ONNX model path.")
            return
            # model = load_pytorch_model(args.model_path)
            # predicted_class, confidence, inference_time = inference_pytorch(model, image_tensor)
            
        # Print results
        print("\nResults:")
        print(f"Predicted class: {class_names[predicted_class]} (Class ID: {predicted_class})")
        print(f"Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
        print(f"Inference time: {inference_time:.2f} ms")
        print(f"Estimated FPS: {1000/inference_time:.1f}")
    else:
        # Process random validation samples
        run_validation_samples(args.model_path, args.data_dir, args.num_samples)


if __name__ == "__main__":
    main()