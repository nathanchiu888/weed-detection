"""
Convert trained TinyResViT model to quantized and ONNX formats for deployment.

Problem: We are able to quantize the model in Pytorch, but on conversion to ONNX, the model is not quantized.
Temporary solution is to only use ONNX conversion
"""

import os
import time
import argparse
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
from models.tinyresvit import TinyResViT
import onnxruntime
from onnxruntime.quantization import quantize_dynamic, QuantType


def load_model(model_path):
    """Load a trained PyTorch model"""
    model = TinyResViT(num_classes=2)
    checkpoint = torch.load(model_path, map_location='cpu')
    
    # problem with format
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    return model


def quantize_model(model):
    """Quantize model to INT8 precision using dynamic quantization"""
    quantized_model = torch.quantization.quantize_dynamic(
        model,
        {nn.Linear, nn.Conv2d},
        dtype=torch.qint8
    )
    
    return quantized_model


def export_to_onnx(model, output_path, input_shape=(1, 3, 224, 224)):
    """Export PyTorch model to ONNX format"""
    # sample input tensor
    random_input = torch.randn(input_shape, requires_grad=True)
    
    # Export the model
    torch.onnx.export(
        model,
        random_input,
        output_path,
        export_params=True,
        opset_version=15,       # ONNX version was 13
        do_constant_folding=True,   # optimization
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={              # batch sizes can change
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    
    print(f"Model exported to ONNX format at: {output_path}")
    return output_path

def optimize_onnx(onnx_path, optimized_path):
    """Optimize ONNX model for inference using ONNX Runtime"""
    try:
        # Quantize the ONNX model
        quantize_dynamic(
            model_input=onnx_path, 
            model_output=optimized_path,
            weight_type=QuantType.QInt8
        )
        print(f"Optimized quantized ONNX model saved to {optimized_path}")
        return optimized_path
    except Exception as e:
        print(f"Error quantizing ONNX model: {e}")
        print("Falling back to regular ONNX model.")
        return onnx_path


def compare_model_sizes(original_path, quantized_path, onnx_path):
    """Compare file sizes of original and optimized models"""
    original_size = os.path.getsize(original_path) / (1024 * 1024)              # original model
    quantized_size = os.path.getsize(quantized_path) / (1024 * 1024)            # pytorch quantized model
    onnx_size = os.path.getsize(onnx_path) / (1024 * 1024)                      # onnx model
    onnx_quantized_size = os.path.getsize(onnx_quantized_path) / (1024 * 1024)  # onnx quantized model
    
    print(f"\nModel Size Comparison:")
    print(f"Original model: {original_size:.2f} MB")
    print(f"Quantized model: {quantized_size:.2f} MB (Reduction: {(1 - quantized_size/original_size)*100:.1f}%)")
    print(f"ONNX model: {onnx_size:.2f} MB")
    print(f"ONNX quantized model: {onnx_quantized_size:.2f} MB (Reduction from ONNX: {(1 - onnx_quantized_size/onnx_size)*100:.1f}%)")


def benchmark_inference(model, quantized_model, input_shape=(1, 3, 224, 224), num_runs=100):
    """Benchmark inference time for original and quantized models"""
    device = torch.device('cpu')
    dummy_input = torch.randn(input_shape).to(device)
    
    for _ in range(10):
        model(dummy_input)
        quantized_model(dummy_input)
    
    # original model
    start_time = time.time()
    for _ in range(num_runs):
        with torch.no_grad():
            model(dummy_input)
    original_time = (time.time() - start_time) / num_runs * 1000
    
    # quantized model
    start_time = time.time()
    for _ in range(num_runs):
        with torch.no_grad():
            quantized_model(dummy_input)
    quantized_time = (time.time() - start_time) / num_runs * 1000
    
    speedup = original_time / quantized_time
    
    print(f"\nInference Performance (CPU):")
    print(f"Original model: {original_time:.2f} ms per image")
    print(f"Quantized model: {quantized_time:.2f} ms per image")
    print(f"Speedup: {speedup:.2f}x")
    
    return original_time, quantized_time, speedup

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert trained model to optimized formats')
    parser.add_argument('--model-path', type=str, 
                        default='model_development/full_training/run_20250503_045116/best_model.pth',
                        help='Path to the trained model')
    parser.add_argument('--output-dir', type=str, default='optimized_models',
                        help='Directory to save optimized models')
    args = parser.parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    model_path = args.model_path
    quantized_path = os.path.join(args.output_dir, 'quantized_model.pth')
    onnx_path = os.path.join(args.output_dir, 'model.onnx')
    onnx_quantized_path = os.path.join(args.output_dir, 'model_quantized.onnx')
    
    print(f"Loading model from {model_path}...")
    model = load_model(model_path)
    
    # export original model to ONNX
    print("Exporting original model to ONNX format...")
    export_to_onnx(model, onnx_path)
    
    # quantize the model in PyTorch (for comparison)
    print("Quantizing model in PyTorch format (for comparison)...")
    quantized_model = quantize_model(model)
    torch.save(quantized_model.state_dict(), quantized_path)
    print(f"PyTorch quantized model saved to {quantized_path}")
    
    # quantize the ONNX model (for Raspberry Pi)
    print("Optimizing and quantizing ONNX model...")
    optimize_onnx(onnx_path, onnx_quantized_path)
    
    compare_model_sizes(model_path, quantized_path, onnx_path)
    
    # test inference performance
    print("\nBenchmarking PyTorch models...")
    orig_time, quant_time, pt_speedup = benchmark_inference(model, quantized_model)
    
    print("\nConversion complete!")
    print(f"PyTorch quantized model: {quantized_path}")
    print(f"ONNX model: {onnx_path}")
    print(f"ONNX quantized model: {onnx_quantized_path} (FOR RASPBERRY PI)")