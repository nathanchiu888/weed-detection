"""
Convert TinyResViT model to quantized ONNX format using Model Compression Toolkit (MCT).

This script:
1. Loads a trained PyTorch model
2. Uses MCT for 8-bit quantization (PTQ - Post-Training Quantization)
3. Exports the quantized model to ONNX format for deployment on Raspberry Pi

Usage:
    FOR TESTING USE THIS:  python model_development/converter_scripts/mct_convert.py
    python model_development/converter_scripts/mct_convert.py --model-path model_development/full_training/run_20250503_045116/best_model.pth --output-dir model_development/edge-optimized-models --data-path data --batch-size 16
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import argparse
import torch
import numpy as np
# from models.tinyresvit import TinyResViT
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from data.dataset import WeedDataset
from torch.utils.data import DataLoader
import model_compression_toolkit as mct


MCT_AVAILABLE = True

def load_model(model_path):
    """Load a trained PyTorch model"""
    # model = TinyResViT(num_classes=2)
    #model = mobilenet_v2()
    model = torch.hub.load('pytorch/vision:v0.10.0', 'mobilenet_v2', pretrained=False)
    checkpoint = torch.load(model_path, map_location='cpu')
    
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    return model


def create_representative_dataset(data_path, batch_size=16, num_batches=10):
    """Create a representative dataset generator for MCT quantization"""
    # Create validation dataset
    val_dataset = WeedDataset(data_path, split='val')
    dataloader = DataLoader(val_dataset, batch_size=batch_size, shuffle=True)
    
    def representative_dataset_gen():
        dataloader_iter = iter(dataloader)
        for _ in range(num_batches):
            try:
                yield [next(dataloader_iter)[0]]
            except StopIteration:
                # Restart iterator if we run out of batches
                dataloader_iter = iter(dataloader)
                yield [next(dataloader_iter)[0]]
    
    return representative_dataset_gen


def quantize_with_mct(model, representative_data_gen, output_path):
    """Quantize the model using MCT and export to ONNX"""
    if not MCT_AVAILABLE:
        print("Error: Model Compression Toolkit is required for quantization")
        return None
    
    print("Starting model quantization with MCT...")
    
    # Get default PyTorch target platform capabilities
    target_platform_cap = mct.get_target_platform_capabilities('pytorch', 'default')
    
    # Apply post-training quantization
    quantized_model, quantization_info = mct.ptq.pytorch_post_training_quantization(
        in_module=model,
        representative_data_gen=representative_data_gen,
        target_platform_capabilities=target_platform_cap
    )
    
    print("Model quantized successfully")
    print(f"Quantization info: {quantization_info}")
    
    # Export the quantized model to ONNX
    print(f"Exporting quantized model to ONNX: {output_path}")
    mct.exporter.pytorch_export_model(
        quantized_model, 
        save_model_path=output_path, 
        repr_dataset=representative_data_gen
    )
    
    print(f"ONNX model exported successfully to {output_path}")
    return quantized_model


def compare_model_sizes(original_path, quantized_path):
    """Compare file sizes of original and quantized models"""
    original_size = os.path.getsize(original_path) / (1024 * 1024)  # Convert to MB
    quantized_size = os.path.getsize(quantized_path) / (1024 * 1024)
    
    print(f"\nModel Size Comparison:")
    print(f"Original PyTorch model: {original_size:.2f} MB")
    print(f"MCT quantized ONNX model: {quantized_size:.2f} MB")
    print(f"Size reduction: {(1 - quantized_size/original_size)*100:.1f}%")


def main():
    parser = argparse.ArgumentParser(description='Convert model to quantized ONNX using MCT')
    parser.add_argument('--model-path', type=str, 
                        default='output/run_20250503_170330/best_model.pth',
                        help='Path to the trained PyTorch model')
    parser.add_argument('--data-path', type=str, default='model_development/data',
                        help='Path to data directory for representative dataset')
    parser.add_argument('--output-dir', type=str, default='model_development/optimized_models_mct',
                        help='Directory to save optimized models')
    parser.add_argument('--batch-size', type=int, default=16,
                        help='Batch size for representative dataset')
    args = parser.parse_args()
    
    if not MCT_AVAILABLE:
        print("Error: Model Compression Toolkit (MCT) is required for this script")
        print("Please install it using: pip install model-compression-toolkit")
        return
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load the model
    print(f"Loading model from {args.model_path}...")
    model = load_model(args.model_path)
    
    # Output path for the quantized ONNX model
    output_path = os.path.join(args.output_dir, 'mct_quantized_model.onnx')
    
    # Create representative dataset generator
    print("Creating representative dataset...")
    representative_data_gen = create_representative_dataset(
        args.data_path, 
        batch_size=args.batch_size
    )
    
    # Quantize model using MCT and export to ONNX
    quantized_model = quantize_with_mct(model, representative_data_gen, output_path)
    
    if os.path.exists(output_path):
        # Compare model sizes
        compare_model_sizes(args.model_path, output_path)
        print("\nModel conversion complete!")
        print(f"MCT quantized ONNX model saved to: {output_path}")
        print("\nYou can now deploy this model on Raspberry Pi")
    else:
        print("Error: Failed to generate quantized ONNX model")


if __name__ == "__main__":
    main()