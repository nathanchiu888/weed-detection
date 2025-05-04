"""
Training script for weed detection model
"""

import argparse
import os
import time
from datetime import datetime
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
from data.dataset import WeedDataset
from models.tinyresvit import TinyResViT
from utils import accuracy


def train_epoch(model, loader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    running_acc = 0.0
    total_samples = 0
    
    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        
        # Forward
        logits = model(imgs)
        loss = criterion(logits, labels)
        
        # Backward
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # metrics
        batch_size = labels.size(0)
        running_loss += loss.item() * batch_size
        running_acc += accuracy(logits, labels) * batch_size
        total_samples += batch_size
    
    return running_loss / total_samples, running_acc / total_samples


def validate(model, loader, criterion, device):
    """Validate model performance"""
    model.eval()
    running_loss = 0.0
    running_acc = 0.0
    total_samples = 0
    
    with torch.no_grad():
        for imgs, labels in loader:
            imgs, labels = imgs.to(device), labels.to(device)
            
            # Forward
            logits = model(imgs)
            loss = criterion(logits, labels)
            
            # metrics
            batch_size = labels.size(0)
            running_loss += loss.item() * batch_size
            running_acc += accuracy(logits, labels) * batch_size
            total_samples += batch_size
    
    return running_loss / total_samples, running_acc / total_samples


def plot_metrics(train_losses, val_losses, train_accs, val_accs, save_dir):
    """Plot training and validation metrics"""
    epochs = range(1, len(train_losses) + 1)
    
    # Plot losses
    plt.figure(figsize=(10, 4))
    plt.subplot(1, 2, 1)
    plt.plot(epochs, train_losses, 'b-', label='Training Loss')
    plt.plot(epochs, val_losses, 'r-', label='Validation Loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    
    # Plot accuracies
    plt.subplot(1, 2, 2)
    plt.plot(epochs, train_accs, 'b-', label='Training Accuracy')
    plt.plot(epochs, val_accs, 'r-', label='Validation Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, 'training_metrics.png'))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=str, default='model_development/data',
                        help='Path to data directory')
    parser.add_argument('--output-dir', type=str, default='output',
                        help='Directory to save checkpoints and results')
    parser.add_argument('--epochs', type=int, default=30)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--lr', type=float, default=1e-3)
    parser.add_argument('--weight-decay', type=float, default=1e-4)
    parser.add_argument('--img-size', type=int, default=224)
    parser.add_argument('--num-classes', type=int, default=2)
    args = parser.parse_args()
    
    # create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_dir = os.path.join(args.output_dir, f'run_{timestamp}')
    os.makedirs(save_dir, exist_ok=True)
    
    # datasets + dataloaders
    print("Loading datasets...")
    train_ds = WeedDataset(args.data_dir, split='train', img_size=args.img_size)
    val_ds = WeedDataset(args.data_dir, split='val', img_size=args.img_size)
    
    # class distribution
    train_dist = train_ds.get_class_distribution()
    val_dist = val_ds.get_class_distribution()
    print(f"Training set: {len(train_ds)} images - Class distribution: {train_dist}")
    print(f"Validation set: {len(val_ds)} images - Class distribution: {val_dist}")
    
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, num_workers=4)
    
    # device, model, optimizer and criterion
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    if 0:
        model = TinyResViT(num_classes=args.num_classes).to(device)
    else:
        model = torch.hub.load('pytorch/vision:v0.10.0', 'mobilenet_v2', pretrained=True).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    criterion = nn.CrossEntropyLoss()
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', factor=0.5, patience=3
    )
    
    # Training loop
    print("Starting training...")
    best_val_acc = 0.0
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    
    for epoch in range(args.epochs):
        start_time = time.time()
        
        # one epoch
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        
        scheduler.step(val_acc)
        
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_accs.append(train_acc)
        val_accs.append(val_acc)
        
        # checkpointing
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            checkpoint = {
                'epoch': epoch + 1,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'val_loss': val_loss,
            }
            torch.save(checkpoint, os.path.join(save_dir, 'best_model.pth'))
            print(f"New best model saved! Validation Accuracy: {val_acc:.4f}")
        
        # latest too
        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_acc': val_acc,
            'val_loss': val_loss,
        }, os.path.join(save_dir, 'latest_model.pth'))
        
        epoch_time = time.time() - start_time
        print(f"Epoch {epoch+1}/{args.epochs} | "
              f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} | "
              f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f} | "
              f"Time: {epoch_time:.2f}s")
    
    # plots
    plot_metrics(train_losses, val_losses, train_accs, val_accs, save_dir)
    print(f"Training complete! Best validation accuracy: {best_val_acc:.4f}")
    print(f"Results saved to {save_dir}")


if __name__ == '__main__':
    main()