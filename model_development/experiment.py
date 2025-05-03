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
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
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