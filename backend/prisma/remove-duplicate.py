#!/usr/bin/env python3
"""
Script to remove duplicate PrescriptionFile model from schema.prisma
Keep the first occurrence (line 1163) and remove the second (line 2870)
"""

def main():
    schema_path = 'schema.prisma'
    
    # Read the file
    with open(schema_path, 'r') as f:
        content = f.read()
    
    # Split into lines
    lines = content.split('\n')
    
    # Find both PrescriptionFile model locations
    prescriptions_file_starts = []
    for i, line in enumerate(lines, 1):
        if line.strip() == 'model PrescriptionFile {':
            prescriptions_file_starts.append(i-1)  # 0-indexed
    
    print(f"Found Prescription File models at lines: {[i+1 for i in prescriptions_file_starts]}")
    
    if len(prescriptions_file_starts) < 2:
        print("No duplicate found!")
        return
    
    # Remove the second occurrence (around line 2870)
    # We'll find the closing brace for the second model
    start_idx = prescriptions_file_starts[1]
    end_idx = start_idx
    
    # Find the closing brace
    brace_count = 0
    for i in range(start_idx, len(lines)):
        line = lines[i].strip()
        if '{' in line:
            brace_count += line.count('{')
        if '}' in line:
            brace_count -= line.count('}')
        if brace_count == 0:
            end_idx = i
            break
    
    print(f"Removing lines {start_idx+1} to {end_idx+1}")
    
    # Remove the duplicate
    del lines[start_idx:end_idx+2]  # +2 to include closing brace and blank line
    
    # Write back
    with open(schema_path, 'w') as f:
        f.write('\n'.join(lines))
    
    print("✅ Successfully removed duplicate PrescriptionFile model")

if __name__ == '__main__':
    main()
