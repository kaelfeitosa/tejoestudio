import sys
import os
from PIL import Image

def remove_background(input_path, output_path=None):
    if not output_path:
        output_path = input_path

    print(f"Processing {input_path}...")
    
    try:
        # Try using rembg first if available
        from rembg import remove
        with open(input_path, 'rb') as i:
            input_data = i.read()
            output_data = remove(input_data)
            with open(output_path, 'wb') as o:
                o.write(output_data)
        print(f"Success! Background removed using rembg and saved to {output_path}")
        return
    except ImportError:
        print("rembg not found. Falling back to simple white-to-alpha conversion...")
    except Exception as e:
        print(f"rembg failed: {e}. Falling back to simple white-to-alpha conversion...")

    # Fallback: Simple white background removal using Pillow
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            # Change all white (also nearly white) pixels to transparent
            # You can adjust the threshold here
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Success! White background removed using Pillow and saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python remove_bg.py <input_path> [output_path]")
    else:
        input_p = sys.argv[1]
        output_p = sys.argv[2] if len(sys.argv) > 2 else None
        remove_background(input_p, output_p)
