"""
Dataset loader for 3-class classification (grass vs broadleaf vs soil).
"""
import os
import random
from PIL import Image
from torch.utils.data import Dataset, random_split
from torchvision import transforms
import torch

# Custom random blur transform
class RandomGaussianBlur(object):
    def __init__(self, p=0.5, kernel_size=5, sigma=(0.1, 2.0)):
        self.p = p
        self.kernel_size = kernel_size
        self.sigma = sigma
        self.blur = transforms.GaussianBlur(kernel_size, sigma)
        
    def __call__(self, img):
        if torch.rand(1).item() < self.p:
            return self.blur(img)
        return img
    
class WeedDataset(Dataset):
    def __init__(self, root_dir, split='train', img_size=224, val_split=0.2, seed=42):
        """
        Args:
            root_dir: Path to the data directory containing Broadleafs, Grasses, and Soil folders
            split: 'train' or 'val' to specify which split to use
            img_size: Size to resize the images to
            val_split: Fraction of data to use for validation
            seed: Random seed for reproducibility
        """
        self.img_size = img_size
        
        # Expected class folders - Updated to include Soil
        self.class_mapping = {
            'Broadleafs': 0,
            'Grasses': 1,
            'Soil': 2
        }
        
        # Collect all image paths and labels by class
        class_paths = {}
        for class_name, class_idx in self.class_mapping.items():
            class_folder = os.path.join(root_dir, class_name)
            if not os.path.exists(class_folder):
                continue
                
            class_paths[class_idx] = []
            for fname in os.listdir(class_folder):
                if fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                    class_paths[class_idx].append((os.path.join(class_folder, fname), class_idx))
        
        # Set seed for reproducible splits
        random.seed(seed)
        
        # Split each class into train/val with stratification
        self.paths = []
        for class_idx, paths in class_paths.items():
            # Shuffle paths for this class
            random.shuffle(paths)
            # Split into train/val
            val_size = int(len(paths) * val_split)
            if split == 'train':
                self.paths.extend(paths[val_size:])  # Training set
            else:  # 'val' split
                self.paths.extend(paths[:val_size])  # Validation set
        
        # Shuffle the final dataset
        random.shuffle(self.paths)
        
        if split == 'train':
            # More aggressive augmentation for training
            self.transform = transforms.Compose([
                transforms.Resize((img_size + 24, img_size + 24)),  # Resize larger for crop
                transforms.RandomCrop((img_size, img_size)),  # Random crop for position invariance
                transforms.RandomHorizontalFlip(),
                transforms.RandomVerticalFlip(),
                transforms.RandomRotation(30),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1, hue=0.1),
                RandomGaussianBlur(p=0.5),  # Apply blur randomly with 50% probability
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
        else:  # 'val' split
            # Minimal processing for validation
            self.transform = transforms.Compose([
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, idx):
        path, label = self.paths[idx]
        # Handle potentially corrupt images
        try:
            img = Image.open(path).convert('RGB')
            img = self.transform(img)
            return img, label
        except Exception as e:
            print(f"Error loading image {path}: {e}")
            # Return a default image in case of error (black image)
            import torch
            return torch.zeros(3, self.img_size, self.img_size), label

    def get_class_distribution(self):
        """Returns the distribution of classes in the dataset"""
        class_counts = {}
        for _, label in self.paths:
            if label not in class_counts:
                class_counts[label] = 0
            class_counts[label] += 1
        return class_counts