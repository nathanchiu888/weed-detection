"""
Lightweight ViT head over 7x7 patches (28/7=4 => 16 patches) or 4x4 grid of 7x7.
"""
import torch
import torch.nn as nn

class PatchEmbed(nn.Module):
    def __init__(self, in_ch, embed_dim, patch_size=7):
        super().__init__()
        self.proj = nn.Conv2d(in_ch, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        # x: B x C x 28 x 28 -> B x embed_dim x 4 x 4
        x = self.proj(x)
        B, C, H, W = x.shape
        x = x.flatten(2).transpose(1, 2)  # B x 16 x embed_dim
        return x

class TransformerBlock(nn.Module):
    def __init__(self, dim, heads=4, mlp_ratio=2.):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, heads, batch_first=True)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, int(dim*mlp_ratio)),
            nn.GELU(),
            nn.Linear(int(dim*mlp_ratio), dim)
        )

    def forward(self, x):
        # x: B x N x dim
        h = x
        x = self.norm1(x)
        x, _ = self.attn(x, x, x)
        x = x + h
        h2 = x
        x = self.norm2(x)
        x = self.mlp(x) + h2
        return x

class TinyViT(nn.Module):
    def __init__(self, in_ch, embed_dim=128, depth=2, heads=4, num_classes=2):
        super().__init__()
        self.patch_embed = PatchEmbed(in_ch, embed_dim)
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, 1+16, embed_dim))
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim, heads) for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        x = self.patch_embed(x)                 # B x 16 x dim
        B, N, _ = x.shape
        cls_tokens = self.cls_token.expand(B, -1, -1)  # B x 1 x dim
        x = torch.cat((cls_tokens, x), dim=1)   # B x 17 x dim
        x = x + self.pos_embed
        for blk in self.blocks:
            x = blk(x)
        x = self.norm(x)
        cls_out = x[:, 0]                       # B x dim
        return self.head(cls_out)