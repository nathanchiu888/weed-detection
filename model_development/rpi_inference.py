"""
Inference script for running the optimized weed detection model on Raspberry Pi.
Supports both PyTorch quantized models and ONNX models.
"""

import os
import time
import argparse
import torch
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from models.tinyresvit import TinyResViT
import onnxruntime

ONNX_AVAILABLE = True

def preprocess_image(image_path, size=224):
    """Preprocess an image for model input"""
    # Open and resize image
    img = Image.open(image_path).convert('RGB')
    
    # Apply preprocessing
    preprocess = transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Process image and add batch dimension
    img_tensor = preprocess(img).unsqueeze(0)
    return img_tensor


def load_pytorch_model(model_path):
    """Load a quantized PyTorch model"""
    model = TinyResViT(num_classes=2)
    
    # Handle different checkpoint formats
    checkpoint = torch.load(model_path, map_location='cpu')
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    return model


def inference_pytorch(model, image_tensor):
    """Run inference using PyTorch model"""
    with torch.no_grad():
        start_time = time.time()
        outputs = model(image_tensor)
        inference_time = (time.time() - start_time) * 1000  # ms
    
    # Get prediction
    probabilities = torch.nn.functional.softmax(outputs, dim=1)
    confidence, predicted_class = torch.max(probabilities, 1)
    
    return predicted_class.item(), confidence.item(), inference_time


def inference_onnx(onnx_path, image_tensor):
    """Run inference using ONNX model"""
    if not ONNX_AVAILABLE:
        raise ImportError("ONNX Runtime is not available. Install with: pip install onnxruntime")
    
    # Create ONNX Runtime session
    sess = onnxruntime.InferenceSession(onnx_path)
    
    # Prepare input
    input_name = sess.get_inputs()[0].name
    numpy_image = image_tensor.numpy()
    
    # Run inference
    start_time = time.time()
    outputs = sess.run(None, {input_name: numpy_image})
    inference_time = (time.time() - start_time) * 1000  # ms
    
    # Process output
    scores = outputs[0][0]
    probabilities = np.exp(scores) / np.sum(np.exp(scores))  # softmax
    predicted_class = np.argmax(probabilities)
    confidence = probabilities[predicted_class]
    
    return predicted_class, confidence, inference_time


def main():
    parser = argparse.ArgumentParser(description='Run inference with optimized weed detection models')
    parser.add_argument('--image', type=str, required=True, help='Path to input image')
    parser.add_argument('--model-type', type=str, choices=['pytorch', 'onnx'], default='onnx',
                        help='Type of model to use (pytorch or onnx)')
    parser.add_argument('--model-path', type=str, 
                        default='optimized_models/model.onnx' if ONNX_AVAILABLE else 'optimized_models/quantized_model.pth',
                        help='Path to the model file')
    args = parser.parse_args()
    
    # Load and preprocess image
    print(f"Processing image: {args.image}")
    image_tensor = preprocess_image(args.image)
    
    # Class names for output
    class_names = {0: 'Broadleaf', 1: 'Grass'}
    
    # Run inference based on model type
    if args.model_type == 'onnx' and ONNX_AVAILABLE:
        print(f"Running inference with ONNX model: {args.model_path}")
        predicted_class, confidence, inference_time = inference_onnx(args.model_path, image_tensor)
    else:
        print(f"Running inference with PyTorch model: {args.model_path}")
        model = load_pytorch_model(args.model_path)
        predicted_class, confidence, inference_time = inference_pytorch(model, image_tensor)
    
    # Print results
    print("\nResults:")
    print(f"Predicted class: {class_names[predicted_class]} (Class ID: {predicted_class})")
    print(f"Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
    print(f"Inference time: {inference_time:.2f} ms")
    print(f"Estimated FPS: {1000/inference_time:.1f}")


if __name__ == "__main__":
    main()