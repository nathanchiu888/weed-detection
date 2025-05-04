"""
Combines TinyResNet backbone + TinyViT head
"""
import torch.nn as nn
from .backbone import TinyResNet
from .transformer import TinyViT

class TinyResViT(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = TinyResNet(channels=[32, 64])
        self.vit = TinyViT(in_ch=64, embed_dim=128, depth=2, heads=4, num_classes=num_classes)

    def forward(self, x):
        x = self.backbone(x)
        x = self.vit(x)
        return x