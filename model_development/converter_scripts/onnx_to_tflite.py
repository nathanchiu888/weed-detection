import os
import argparse
import onnx
from onnx_tf.backend import prepare
import tensorflow as tf

def convert_onnx_to_tf(onnx_model_path, tf_model_path):
    print(f"Loading ONNX model from: {onnx_model_path}")
    onnx_model = onnx.load(onnx_model_path)
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph(tf_model_path)
    print(f"Saved TensorFlow model to: {tf_model_path}")

def convert_tf_to_tflite(tf_model_path, tflite_model_path):
    print(f"Converting TensorFlow model at: {tf_model_path}")
    converter = tf.lite.TFLiteConverter.from_saved_model(tf_model_path)
    tflite_model = converter.convert()
    with open(tflite_model_path, "wb") as f:
        f.write(tflite_model)
    print(f"Saved TFLite model to: {tflite_model_path}")

def main():
    parser = argparse.ArgumentParser(description="Convert ONNX model to TFLite.")
    parser.add_argument("onnx_model", help="Path to ONNX model file (.onnx)")
    parser.add_argument("output_tflite", help="Path to output TFLite model (.tflite)")
    args = parser.parse_args()

    tf_model_dir = "temp_tf_model"

    # Step 1: ONNX → TensorFlow
    convert_onnx_to_tf(args.onnx_model, tf_model_dir)

    # Step 2: TensorFlow → TFLite
    convert_tf_to_tflite(tf_model_dir, args.output_tflite)

    # # Optional: Clean up
    # import shutil
    # shutil.rmtree(tf_model_dir)

if __name__ == "__main__":
    main()