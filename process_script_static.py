import sys
import os
import subprocess
from pathlib import Path
import csv
import pandas as pd
import json

def preprocess(domain):
    domain = domain.lower()
    parts = domain.split(".")
    if len(parts) > 2:
        if len(parts[-2]) > 3:
            domain = parts[-2] + "." + parts[-1]
        else:
            domain = parts[-3] + "." + parts[-2] + "." + parts[-1] 
    return domain

def run_phishing(domain):
    status, output = subprocess.getstatusoutput("python3 phishing_static.py --geoip --whois -f json " + domain)
    if status != 0:
        print(f"Error running phishing for {domain}. Status: {status}")
        print(f"Error Output: {output}")
        return None
    print(output)
    try:
        return json.loads(output)
    except Exception as e:
        return None

if __name__ == "__main__":
    if len(sys.argv) == 1:
        input_string = pd.read_csv('/home/cdot/typosquatting/dynamic/phishing_domain/phishingDomain011020241212.csv')
        file_path = "/home/cdot/typosquatting/Node-UI/dynamic/tsoc_live_data.csv"

        details = []
        input_string['domainName_SSlServerName'] = input_string['domainName_SSlServerName'].str[:-1]
        input_string['domainName_SSlServerName'] = input_string['domainName_SSlServerName'].apply(preprocess)

        for domain in input_string['domainName_SSlServerName']:
            output_details = run_phishing(domain)
            if output_details is not None:
                details.append(output_details[0])

        df = pd.DataFrame(details)
        for column in df.columns:
            df[column] = df[column].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)

        df = df[['fuzzer', 'domain', 'dns_a', 'dns_aaaa', 'dns_mx', 'dns_ns', 'geoip', 'whois_created', 'whois_registrar']]
        df.rename(columns={
            'fuzzer': 'Fuzzer',
            'domain': 'Domain',
            'dns_a': 'IPv4',
            'dns_aaaa': 'IPv6',
            'dns_mx': 'Mail Server',
            'dns_ns': 'Name Server',
            'geoip': 'Location',
            'whois_created': 'Created On',
            'whois_registrar': 'Registrar'
        }, inplace=True)

        # Drop rows where all fields except 'Domain' and 'Fuzzer' are empty
        df = df.dropna(how='all', subset=['IPv4', 'IPv6', 'Mail Server', 'Name Server', 'Location', 'Created On', 'Registrar'])

        # Save the modified DataFrame to a temporary file
        df.to_csv(file_path + "_temp", index=False)

        # Open the temp file and output file for reading and writing
        with open(file_path + "_temp", "r") as read_file, open(file_path, "w", newline='') as write_file:
            reader = csv.reader(read_file)
            writer = csv.writer(write_file)

            ip6exist = True
            for count, row in enumerate(reader):
                if count == 0:
                    # Modify the header to include Location, CreatedOn, and Registrar
                    if "IPv6" in row:
                        writer.writerow(["Domain", "IPv4", "IPv6", "Name Server", "Mail Server", "Location", "Created On", "Registrar"])
                    else:
                        writer.writerow(["Domain", "IPv4", "Name Server", "Mail Server", "Location", "Created On", "Registrar"])
                        ip6exist = False
                else:
                    if ip6exist:
                        # Adjusting for IPv6 present
                        writer.writerow([row[1], row[2], row[3], row[5], row[4], row[6], row[7], row[8]])
                    else:
                        # Adjusting for no IPv6
                        writer.writerow([row[1], row[2], row[4], row[3], row[5], row[6], row[7]])

        # Clean up temp file
        os.remove(file_path + "_temp")
