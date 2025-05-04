"""
Helper functions for model development? Maybe no need?
"""
def accuracy(output, target):
    """Compute top-1 accuracy"""
    pred = output.argmax(dim=1)
    correct = (pred == target).sum().item()
    return correct / target.size(0)