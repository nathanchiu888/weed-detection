# weed-detection
Web application and model architecture for intra-row weed detection

# How to make a model running on RaspberryPi?
1. Install dependencies
```
conda install openjdk
```

2. Train a model
```bash
python model_development/train.py
```

3. Quantize model uisng mct_quantize
```
python model_development/converter_scripts/mct_convert.py --model-path output/run_20250503_170330/best_model.pth
```


4. Convert model using imxconv-pt
```bash
imxconv-pt -i model_development/optimized_models_mct/mct_quantized_model.onnx -o model_development/optimized_models_mct/output
```
Copy the converted zip file to raspberry pi

5. On Raspberry pi run
```
imx500-package -i output_rpi/packerOut.zip -o output_rpi
```