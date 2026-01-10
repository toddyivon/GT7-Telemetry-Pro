#!/usr/bin/env python3
"""
Deployment helper script for GT7 Telemetry Pro
Uses paramiko for SSH operations with password authentication
"""

import paramiko
import os
import sys
import stat
from pathlib import Path

# Server configuration
SERVER_IP = "10.70.23.152"
SERVER_USER = "missola"
SERVER_PATH = "/home/missola/gt7-saas"

# Directories/files to exclude from rsync
EXCLUDE_PATTERNS = [
    'node_modules',
    '.git',
    '.next',
    '__pycache__',
    '*.pyc',
    '.env.local',
    'deploy_helper.py'
]

def get_password():
    """Get password - can be passed as argument or environment variable"""
    if len(sys.argv) > 1:
        return sys.argv[1]
    return os.environ.get('SSH_PASSWORD', '')

def create_ssh_client(host, user, password):
    """Create and return SSH client"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=30)
    return client

def exec_command(client, command, print_output=True):
    """Execute command and return output"""
    stdin, stdout, stderr = client.exec_command(command)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    exit_code = stdout.channel.recv_exit_status()

    if print_output:
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")

    return out, err, exit_code

def should_exclude(path, base_path):
    """Check if path should be excluded"""
    rel_path = os.path.relpath(path, base_path)
    for pattern in EXCLUDE_PATTERNS:
        if pattern in rel_path.split(os.sep):
            return True
        if pattern.startswith('*') and rel_path.endswith(pattern[1:]):
            return True
    return False

def upload_directory(sftp, local_path, remote_path, base_path=None):
    """Recursively upload directory via SFTP"""
    if base_path is None:
        base_path = local_path

    local_path = Path(local_path)

    # Create remote directory if it doesn't exist
    try:
        sftp.stat(remote_path)
    except FileNotFoundError:
        sftp.mkdir(remote_path)
        print(f"Created directory: {remote_path}")

    for item in local_path.iterdir():
        if should_exclude(str(item), str(base_path)):
            print(f"Skipping: {item.name}")
            continue

        local_item = str(item)
        remote_item = f"{remote_path}/{item.name}"

        if item.is_dir():
            upload_directory(sftp, local_item, remote_item, str(base_path))
        else:
            try:
                print(f"Uploading: {item.relative_to(base_path)}")
                sftp.put(local_item, remote_item)
            except Exception as e:
                print(f"Error uploading {item.name}: {e}")

def main():
    password = get_password()
    if not password:
        print("Error: Password required. Pass as argument or set SSH_PASSWORD env var")
        sys.exit(1)

    project_path = r"C:\Users\missola\CODE\GT7\GT7_SaaS"

    print(f"Connecting to {SERVER_USER}@{SERVER_IP}...")

    try:
        # Create SSH client
        client = create_ssh_client(SERVER_IP, SERVER_USER, password)
        print("SSH connection established!")

        # Create SFTP client
        sftp = client.open_sftp()

        # Create deployment directory
        print(f"\nCreating deployment directory: {SERVER_PATH}")
        exec_command(client, f"mkdir -p {SERVER_PATH}")

        # Upload files
        print(f"\nUploading files from {project_path}...")
        upload_directory(sftp, project_path, SERVER_PATH)

        print("\nFile upload complete!")

        # Run docker compose
        print("\n" + "="*50)
        print("Running docker compose...")
        print("="*50)

        docker_cmd = f"cd {SERVER_PATH} && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans"
        print(f"Executing: {docker_cmd}")
        out, err, exit_code = exec_command(client, docker_cmd)

        if exit_code != 0:
            print(f"Docker compose failed with exit code {exit_code}")
        else:
            print("Docker compose completed successfully!")

        # Verify deployment
        print("\n" + "="*50)
        print("Verifying deployment...")
        print("="*50)

        exec_command(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")

        # Close connections
        sftp.close()
        client.close()

        print("\n" + "="*50)
        print("Deployment complete!")
        print(f"Web app should be accessible at: http://{SERVER_IP}:3000")
        print("="*50)

    except paramiko.AuthenticationException:
        print("Authentication failed. Check username/password.")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"SSH error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
