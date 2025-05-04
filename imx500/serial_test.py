import serial
import time

# Configure the serial connection
ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=2)  # Adjust the port and baudrate as necessary

# Ensure the serial port is open
if ser.is_open:
    print("Serial port is already open")
else:
    ser.open()

try:
    while True:
        # Send the GET_GPS message followed by a newline if required
        ser.write(b"GET_GPS")  # Use b'' to send bytes

        # Wait for a moment to allow the device to respond
        time.sleep(1)

        # Read the response (adjust the number of bytes based on expected response size)
        response = ser.readline()  # Read a line from the serial
        print("Response:", response.decode('utf-8').strip())

        # Wait for 2 seconds before sending the next request
        time.sleep(2)

except KeyboardInterrupt:
    print("Exiting...")
finally:
    ser.close()  # Make sure to close the serial port on exit
