import argparse
import sys
import time
from typing import List

import cv2
import numpy as np

from picamera2 import CompletedRequest, MappedArray, Picamera2
from picamera2.devices import IMX500
from picamera2.devices.imx500 import NetworkIntrinsics
from picamera2.devices.imx500.postprocess import softmax

last_detections = []
LABELS = None

import serial
from datetime import datetime


# Configure the serial connection
ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=2)

# Ensure the serial port is open
if ser.is_open:
    print("Serial port is already open")
else:
    ser.open()

# Get current time in seconds since the epoch
timestamp_seconds_prev = time.time()
print("Timestamp (seconds):", timestamp_seconds_prev)
lat = 0
lon = 0
timestamp = "2025-05-04T13:01:57Z"

# Function to parse response and extract latitude, longitude, and time
def parse_response(response):
    try:
        # Decode the response if it's in bytes
        if isinstance(response, bytes):
            response = response.decode('utf-8')
        
        # Remove whitespace and split the response by commas
        data = response.strip().split(',')
        
        # Extract latitude, longitude, and time
        latitude = float(data[0])
        longitude = float(data[1])
        timestamp = data[3]  # The timestamp is at the 4th position

        # Convert timestamp to a datetime object for further processing
        time_received = datetime.fromisoformat(timestamp[:-1])  # Remove 'Z' for ISO conversion
        
        return latitude, longitude, time_received
    except (IndexError, ValueError) as e:
        print("Error parsing response:", e)
        return None, None, None

class Classification:
    def __init__(self, idx: int, score: float):
        """Create a Classification object, recording the idx and score."""
        self.idx = idx
        self.score = score


def get_label(request: CompletedRequest, idx: int) -> str:
    """Retrieve the label corresponding to the classification index."""
    global LABELS
    if LABELS is None:
        LABELS = intrinsics.labels
        assert len(LABELS) in [1000, 1001], "Labels file should contain 1000 or 1001 labels."
        output_tensor_size = imx500.get_output_shapes(request.get_metadata())[0][0]
        if output_tensor_size == 1000:
            LABELS = LABELS[1:]  # Ignore the background label if present
    return LABELS[idx]


def parse_and_draw_classification_results(request: CompletedRequest):
    """Analyse and draw the classification results in the output tensor."""
    results = parse_classification_results(request)
    draw_classification_results(request, results)


def parse_classification_results(request: CompletedRequest) -> List[Classification]:
    """Parse the output tensor into the classification results above the threshold."""
    global last_detections
    np_outputs = imx500.get_outputs(request.get_metadata())
    if np_outputs is None:
        return last_detections
    np_output = np_outputs[0]
    if intrinsics.softmax:
        np_output = softmax(np_output)

    #top_indices = np.argpartition(-np_output, 3)[:3]  # Get top 3 indices with the highest scores
    top_indices = np.argpartition(-np_output, 1)[:1]  # Get the top 1
    top_indices = top_indices[np.argsort(-np_output[top_indices])]  # Sort the top 3 indices by their scores
    last_detections = [Classification(index, np_output[index]) for index in top_indices]
    return last_detections


def draw_classification_results(request: CompletedRequest, results: List[Classification], stream: str = "main"):
    global timestamp_seconds_prev,lat,lon,timestamp
    """Draw the classification results for this request onto the ISP output."""
    with MappedArray(request, stream) as m:
        font_scale = 0.5 #0.5
        font_thickness = 1
        if intrinsics.preserve_aspect_ratio:
            # Drawing ROI box
            b_x, b_y, b_w, b_h = imx500.get_roi_scaled(request)
            color = (255, 0, 0)  # red
            cv2.putText(m.array, "ROI", (b_x + 5, b_y + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            cv2.rectangle(m.array, (b_x, b_y), (b_x + b_w, b_y + b_h), (255, 0, 0, 0))
            text_left, text_top = b_x, b_y + 20
        else:
            text_left, text_top = 0, 0
        # Drawing labels (in the ROI box if it exists)
        for index, result in enumerate(results):
            label = get_label(request, idx=result.idx)
            text = f"{label}: {result.score:.3f}"

            # Calculate text size and position
            (text_width, text_height), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
            text_x = text_left + 5
            text_y = text_top + 15 + index * 20

            # Create a copy of the array to draw the background with opacity
            overlay = m.array.copy()

            # Draw the background rectangle on the overlay
            cv2.rectangle(overlay,
                          (text_x, text_y - text_height),
                          (text_x + text_width, text_y + baseline),
                          (255, 255, 255),  # Background color (white)
                          cv2.FILLED)

            alpha = 0.3
            cv2.addWeighted(overlay, alpha, m.array, 1 - alpha, 0, m.array)

            # Draw text on top of the background
            cv2.putText(m.array, text, (text_x, text_y),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 255), 1)
    
        # Get current time in seconds since the epoch
        timestamp_seconds = time.time()
        #print("Timestamp (seconds):", timestamp_seconds)
        if timestamp_seconds - timestamp_seconds_prev > 3.0:
            # Send the GET_GPS message followed by a newline if requi>
            ser.write(b"GET_GPS")  # Use b'' to send bytes
            timestamp_seconds_prev = timestamp_seconds
            # Read the response (adjust the number of bytes based on >
            response = ser.readline()  # Read a line from the serial
            print("Response:", response.decode('utf-8').strip())
            if len(response) > 2:
                # Parse the response
                lat, lon, timestamp = parse_response(response)
                if lat is not None and lon is not None:
                    print(f"Latitude: {lat}, Longitude: {lon}, Time: {timestamp}")



        # Draw GPS Coordinate at the bottom
        text = f"Lat:{lat:.6f} Lon: {lon:.6f} Time:{timestamp}"
        # Calculate text size and position
        (text_width, text_height), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
        text_x = text_left + 5
        text_y = text_top + 15 + (index + 1)*20

        # Create a copy of the array to draw the background with opacity
        overlay = m.array.copy()

        # Draw the background rectangle on the overlay
        cv2.rectangle(overlay,
                (text_x, text_y - text_height),
                (text_x + text_width, text_y + baseline),
                (255, 255, 255),  # Background color (white)
                cv2.FILLED)

        alpha = 0.3
        cv2.addWeighted(overlay, alpha, m.array, 1 - alpha, 0, m.array)

        # Draw text on top of the background
        cv2.putText(m.array, text, (text_x, text_y),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 255), font_thickness)

def get_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, help="Path of the model",
                        default="/usr/share/imx500-models/imx500_network_mobilenet_v2.rpk")
    parser.add_argument("--fps", type=int, help="Frames per second")
    parser.add_argument("-s", "--softmax", action=argparse.BooleanOptionalAction, help="Add post-process softmax")
    parser.add_argument("-r", "--preserve-aspect-ratio", action=argparse.BooleanOptionalAction,
                        help="preprocess the image with preserve aspect ratio")
    parser.add_argument("--labels", type=str,
                        help="Path to the labels file")
    parser.add_argument("--print-intrinsics", action="store_true",
                        help="Print JSON network_intrinsics then exit")
    return parser.parse_args()


if __name__ == "__main__":
    args = get_args()

    # This must be called before instantiation of Picamera2
    imx500 = IMX500(args.model)
    intrinsics = imx500.network_intrinsics
    if not intrinsics:
        intrinsics = NetworkIntrinsics()
        intrinsics.task = "classification"
    elif intrinsics.task != "classification":
        print("Network is not a classification task", file=sys.stderr)
        exit()

    # Override intrinsics from args
    for key, value in vars(args).items():
        if key == 'labels' and value is not None:
            with open(value, 'r') as f:
                intrinsics.labels = f.read().splitlines()
        elif hasattr(intrinsics, key) and value is not None:
            setattr(intrinsics, key, value)

    # Defaults
    if intrinsics.labels is None:
        with open("assets/imagenet_labels.txt", "r") as f:
            intrinsics.labels = f.read().splitlines()
    intrinsics.update_with_defaults()

    if args.print_intrinsics:
        print(intrinsics)
        exit()

    picam2 = Picamera2(imx500.camera_num)
    config = picam2.create_preview_configuration(controls={"FrameRate": intrinsics.inference_rate}, buffer_count=12)

    imx500.show_network_fw_progress_bar()
    picam2.start(config, show_preview=True)
    if intrinsics.preserve_aspect_ratio:
        imx500.set_auto_aspect_ratio()
    # Register the callback to parse and draw classification results
    picam2.pre_callback = parse_and_draw_classification_results

    while True:
        time.sleep(0.5)
