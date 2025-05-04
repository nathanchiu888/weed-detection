"""
Lightweight ResNet-like backbone with reduced channels.
"""
import torch.nn as nn

class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, stride=1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, stride=stride, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )
    def forward(self, x):
        return self.net(x)

class ResBlock(nn.Module):
    def __init__(self, ch):
        super().__init__()
        self.conv1 = ConvBlock(ch, ch)
        self.conv2 = nn.Sequential(
            nn.Conv2d(ch, ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(ch)
        )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        out = self.conv1(x)
        out = self.conv2(out)
        out += x
        return self.relu(out)

class TinyResNet(nn.Module):
    def __init__(self, channels=[32, 64]):
        super().__init__()
        self.stem = ConvBlock(3, channels[0])   # 224-224
        self.pool = nn.MaxPool2d(2, 2)          # 224-112
        self.layer1 = nn.Sequential(
            ResBlock(channels[0]),
            ConvBlock(channels[0], channels[1], stride=2)  # 112-56
        )
        self.layer2 = nn.Sequential(
            ResBlock(channels[1]),
            ConvBlock(channels[1], channels[1], stride=2)  # 56-28
        )

    def forward(self, x):
        x = self.stem(x)
        x = self.pool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        return x  # shape: B x C x 28 x 28