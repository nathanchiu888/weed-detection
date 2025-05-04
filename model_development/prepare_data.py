"""
Data preparation script for weed detection dataset.
This script helps to analyze and prepare the dataset for training.
"""
import os
import torch
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
import numpy as np
import argparse
from torchvision.utils import make_grid
from data.dataset import WeedDataset

def show_batch(imgs, labels, class_names, rows=4):
    """Display a batch of images with their labels"""
    # Denormalize the images
    mean = torch.tensor([0.485, 0.456, 0.406]).reshape(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).reshape(3, 1, 1)
    imgs = imgs.cpu() * std + mean  # Denormalize
    imgs = torch.clamp(imgs, 0, 1)  # Clamp to [0, 1]
    
    # Convert labels to class names - convert tensor to int first
    label_names = [class_names[label.item()] for label in labels]
    
    # Grid of images
    grid = make_grid(imgs, nrow=rows, padding=2)
    plt.figure(figsize=(12, 12))
    plt.imshow(grid.permute(1, 2, 0))
    plt.title('Batch of Images')
    plt.axis('off')
    
    for i, label in enumerate(label_names):
        row = i // rows
        col = i % rows
        plt.text(col * (imgs.shape[2] + 2) + imgs.shape[2]/2, 
                 row * (imgs.shape[3] + 2) + imgs.shape[3] + 5, 
                 label, ha='center')
    
    plt.tight_layout()
    plt.savefig('model_development/sample_batch.png')
    print(f"Sample batch saved to 'sample_batch.png'")

def visualize_class_distribution(dataset, class_names):
    """Visualize class distribution in the dataset"""
    class_dist = dataset.get_class_distribution()
    classes = list(class_dist.keys())
    counts = list(class_dist.values())
    
    plt.figure(figsize=(10, 5))
    plt.bar(classes, counts, color=['blue', 'green'])
    plt.xticks(classes, [class_names[c] for c in classes])
    plt.title('Class Distribution')
    plt.xlabel('Classes')
    plt.ylabel('Number of Samples')
    
    for i, count in enumerate(counts):
        plt.text(classes[i], count + 5, str(count), ha='center')
    
    plt.tight_layout()
    plt.savefig('model_development/class_distribution.png')
    print(f"Class distribution saved to 'class_distribution.png'")
    
    total = sum(counts)
    print(f"\nClass Distribution:")
    for i, count in enumerate(counts):
        percentage = (count / total) * 100
        c = classes[i]
        # Use .item() if c is a tensor - there was a problem here before CAREFUL!
        class_name = class_names[c.item() if isinstance(c, torch.Tensor) else c]
        print(f"{class_name}: {count} samples ({percentage:.1f}%)")

def main():
    parser = argparse.ArgumentParser(description='Prepare and analyze weed detection dataset')
    parser.add_argument('--data-dir', type=str, default='model_development/data',
                        help='Path to data directory containing Broadleafs, Grasses, and Soil folders')
    parser.add_argument('--batch-size', type=int, default=16, help='Batch size for visualization')
    args = parser.parse_args()
    
    # Ensure data directory exists
    data_path = os.path.abspath(args.data_dir)
    if not os.path.exists(data_path):
        print(f"Error: Data directory {data_path} not found")
        return
    
    # Check if required folders exist
    broadleafs_path = os.path.join(data_path, 'Broadleafs')
    grasses_path = os.path.join(data_path, 'Grasses')
    soil_path = os.path.join(data_path, 'Soil')
    
    if not os.path.exists(broadleafs_path) or not os.path.exists(grasses_path):
        print(f"Error: Broadleafs or Grasses folder not found in {data_path}")
        return
        
    if not os.path.exists(soil_path):
        print(f"Warning: Soil folder not found in {data_path}. Only processing Broadleafs and Grasses.")
    
    # Class mapping with three classes
    class_names = {0: 'Broadleaf', 1: 'Grass', 2: 'Soil'}
    
    # Create datasets
    print("Creating training and validation datasets...")
    train_ds = WeedDataset(data_path, split='train')
    val_ds = WeedDataset(data_path, split='val')
    
    print(f"Training dataset size: {len(train_ds)} samples")
    print(f"Validation dataset size: {len(val_ds)} samples")
    
    # Create data loaders
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)
    
    # Visualize class distribution
    print("\nAnalyzing class distribution...")
    visualize_class_distribution(train_ds, class_names)
    
    # Display a batch of training images
    print("\nVisualizing a batch of training images...")
    imgs, labels = next(iter(train_loader))
    show_batch(imgs, labels, class_names)
    
    print("\nDataset preparation and analysis completed!")

if __name__ == '__main__':
    main()