"""
Convert TinyResViT PyTorch model directly to TFLite format using ai-edge-torch.

This script:
1. Loads a trained PyTorch model
2. Converts it to TFLite format in one step using ai-edge-torch
3. Provides options for quantization and optimization

Usage:
    python pytorch_to_tflite.py --model-path full_training/run_20250503_045116/best_model.pth --output-path optimized_models/model.tflite
    python model_development/converter_scripts/pytorch_to_tflite.py --model-path model_development/full_training/run_20250503_045116/best_model.pth --output-path model_development/edge-optimized-models/model.tflite

Requirements:
    pip install ai-edge-torch tensorflow
"""

import os
import sys
import argparse
import numpy as np
import torch
from torch.utils.data import DataLoader

# Add the parent directory to system path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.tinyresvit import TinyResViT
from data.dataset import WeedDataset

try:
    import ai_edge_torch
    from ai_edge_torch.converter import TFLiteConverter
except ImportError:
    print("Error: ai-edge-torch is not installed.")
    print("Please install it using: pip install ai-edge-torch")
    sys.exit(1)

def load_model(model_path):
    """Load a trained PyTorch model"""
    print(f"Loading PyTorch model from: {model_path}")
    model = TinyResViT(num_classes=2)
    checkpoint = torch.load(model_path, map_location='cpu')
    
    # Handle different checkpoint formats
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    return model

def create_representative_dataset(data_path, batch_size=1, num_samples=100):
    """Create a representative dataset generator for quantization"""
    # Create validation dataset
    val_dataset = WeedDataset(data_path, split='val')
    dataloader = DataLoader(val_dataset, batch_size=batch_size, shuffle=True)
    
    def representative_dataset_gen():
        count = 0
        for images, _ in dataloader:
            if count >= num_samples:
                break
            # Convert to numpy and yield
            yield [images.numpy()]
            count += 1
    
    return representative_dataset_gen

def convert_to_tflite(model, input_shape=(1, 3, 224, 224), 
                     quantize=True, data_path=None, output_path="model.tflite"):
    """Convert PyTorch model to TFLite format"""
    print("Starting conversion to TFLite...")
    
    # Create converter
    converter = TFLiteConverter(model, input_shape, output_path)
    
    # Configure quantization if enabled
    if quantize and data_path:
        print("Applying quantization...")
        representative_dataset = create_representative_dataset(data_path)
        converter.quantize(representative_dataset)
    
    converter.convert()
    
    print(f"Conversion complete! TFLite model saved to: {output_path}")
    
    model_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"TFLite model size: {model_size:.2f} MB")
    
    return output_path

def main():
    parser = argparse.ArgumentParser(description='Convert PyTorch model to TFLite using ai-edge-torch')
    parser.add_argument('--model-path', type=str, required=True, 
                        help='Path to the trained PyTorch model')
    parser.add_argument('--output-path', type=str, default='optimized_models/model.tflite',
                        help='Path to save the TFLite model')
    parser.add_argument('--data-path', type=str, default=None,
                        help='Path to data for quantization dataset')
    parser.add_argument('--quantize', action='store_true',
                        help='Apply quantization to reduce model size')
    parser.add_argument('--input-shape', type=int, nargs=4, default=[1, 3, 224, 224],
                        help='Input shape for the model (batch_size, channels, height, width)')
    args = parser.parse_args()
    
    os.makedirs(os.path.dirname(os.path.abspath(args.output_path)), exist_ok=True)
    
    model = load_model(args.model_path)
    
    tflite_path = convert_to_tflite(
        model, 
        input_shape=tuple(args.input_shape),
        quantize=args.quantize,
        data_path=args.data_path,
        output_path=args.output_path
    )
    
    print(f"\nThe TFLite model is ready for deployment on Raspberry Pi or other edge devices")
    print(f"Model path: {tflite_path}")
    
    if os.path.exists(args.model_path):
        original_size = os.path.getsize(args.model_path) / (1024 * 1024)
        tflite_size = os.path.getsize(args.output_path) / (1024 * 1024)
        print(f"\nModel size comparison:")
        print(f"Original PyTorch model: {original_size:.2f} MB")
        print(f"TFLite model: {tflite_size:.2f} MB")
        print(f"Size reduction: {(1 - tflite_size/original_size)*100:.1f}%")

if __name__ == "__main__":
    main()