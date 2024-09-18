import sys
import os
import csv
import requests
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from concurrent.futures import ThreadPoolExecutor, as_completed
import socket
import dns.resolver
import whois
import string
from datetime import datetime

def process_input(input_string: str) -> str:
    return f"Processed input: {input_string}"

def preprocess(domain):
    domain = domain.lower()
    parts = domain.split(".")
    if len(parts) > 2:
        if len(parts[-2]) > 3:
            domain = parts[-2]
        else:
            domain = parts[-3] + "." + parts[-2]
    else:
        domain = parts[-2]
    tld = "." + parts[-1]
    return domain, tld

# Typo-squatting functions
def delete_letter(word, tld):
    split_l = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    delete_l = [L + R[1:] + tld for L, R in split_l if R]
    return delete_l

def switch_letter(word, tld):
    split_l = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    switch_l = [a + b[:2][::-1] + b[2:] + tld for a, b in split_l if len(b) > 1]
    return switch_l

def replace_letter(word, tld):
    letters = string.ascii_lowercase + string.digits + '-'
    split_l = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    replace_l = [a + letter + b[1:] + tld for a, b in split_l for letter in letters if len(b) > 0 and letter != b[0]]
    return replace_l

def insert_letter(word, tld):
    letters = string.ascii_lowercase + string.digits + '-'
    split_l = [(word[:i], word[i:]) for i in range(len(word) + 1)]
    insert_l = [a + letter + b + tld for a, b in split_l for letter in letters]
    return insert_l

def edit_one_letter(word, tld, allow_switches=True):
    """Generate all possible typo variations of the domain name that are one edit away."""
    edit_one_set = set()
    edit_one_set.update(delete_letter(word, tld))
    if allow_switches:
        edit_one_set.update(switch_letter(word, tld))
    edit_one_set.update(replace_letter(word, tld))
    edit_one_set.update(insert_letter(word, tld))

    # Remove domains that start or end with '-'
    return [s for s in edit_one_set if all(not (part.startswith('-') or part.endswith('-')) for part in s.split('.'))]

# DNS and WHOIS data fetching
def fetch_dns_records(domain):
    """Fetch IPv4, IPv6, NS, MX, and WHOIS data for the domain."""
    records = {
        "Domain": domain,
        "IPv4": set(),
        "IPv6": set(),
        "Name Server (NS)": set(),
        "Mail Server (MX)": set(),
        "Location": None,
        "Created On": None,
        "Registrar": None
    }

    # Fetch IPv4 and IPv6 addresses
    try:
        addrinfo = socket.getaddrinfo(domain, None)
        for result in addrinfo:
            ip = result[4][0]
            if ':' in ip:
                records["IPv6"].add(ip)
            else:
                records["IPv4"].add(ip)
    except socket.error:
        pass

    # Fetch NS records
    try:
        ns_records = dns.resolver.resolve(domain, 'NS')
        records["Name Server (NS)"].update(str(ns.target) for ns in ns_records)
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        pass

    # Fetch MX records
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        records["Mail Server (MX)"].update(str(mx.exchange) for mx in mx_records)
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        pass

    # Fetch WHOIS data for Location, Created On, and Registrar
    try:
        whois_info = whois.whois(domain)
        records["Location"] = whois_info.get('country', 'Unknown')
        created_on = whois_info.get('creation_date')
        if isinstance(created_on, list):
            created_on = created_on[0]
        if created_on:
            records["Created On"] = created_on.strftime('%Y-%m-%d') if isinstance(created_on, datetime) else str(created_on)
        records["Registrar"] = whois_info.get('registrar', 'Unknown')
    except Exception as e:
        print(f"Error fetching WHOIS data for {domain}: {e}")

    records["IPv4"] = list(records["IPv4"])
    records["IPv6"] = list(records["IPv6"])
    records["Name Server (NS)"] = list(records["Name Server (NS)"])
    records["Mail Server (MX)"] = list(records["Mail Server (MX)"])

    if records["IPv4"] or records["IPv6"] or records["Name Server (NS)"] or records["Mail Server (MX)"]:
        return records
    else:
        return None

def fetch_all_dns_records(domains, max_workers=20):
    """Fetch DNS records for all domains in parallel."""
    filtered_domains = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_domain = {executor.submit(fetch_dns_records, domain): domain for domain in domains}
        for future in as_completed(future_to_domain):
            result = future.result()
            if result:
                filtered_domains.append(result)
    return filtered_domains

# Content fetching and resemblance score calculation
def fetch_page_content(domain):
    """Fetch the page content of a domain."""
    try:
        response = requests.get(f"http://{domain}", timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        return domain, soup.get_text()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {domain}: {e}")
        return domain, None

def calculate_similarity_score(content1, content2):
    """Calculate similarity score using TF-IDF and cosine similarity."""
    if content1 and content2:
        documents = [content1, content2]
        tfidf_vectorizer = TfidfVectorizer().fit_transform(documents)
        cosine_sim = cosine_similarity(tfidf_vectorizer[0:1], tfidf_vectorizer[1:2])
        return cosine_sim[0][0]
    return 0.0

def fetch_all_domains_content(domains, max_workers=10):
    """Fetch content for all domains in parallel."""
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_domain = {executor.submit(fetch_page_content, domain): domain for domain in domains}
        results = {}
        for future in as_completed(future_to_domain):
            domain, content = future.result()
            results[domain] = content
        return results

def add_resemble_score_to_csv(csv_file_path):
    """Add resemblance score to each domain in CSV."""
    new_rows = []
    
    with open(csv_file_path, mode='r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        rows = list(csv_reader)

        if rows:
            domains = [row['Domain'] for row in rows]
            contents = fetch_all_domains_content(domains)

            genuine_domain = rows[0]['Domain']
            genuine_content = contents[genuine_domain]

            fieldnames = csv_reader.fieldnames + ['Resemble Score']

            for row in rows:
                related_domain = row['Domain']
                related_content = contents.get(related_domain, "")
                resemble_score = calculate_similarity_score(genuine_content, related_content)
                row['Resemble Score'] = round(resemble_score, 3)
                new_rows.append(row)

    # Write updated rows back to CSV
    with open(csv_file_path, mode='w', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)

    print("Updated CSV saved with resemblance scores.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_string = sys.argv[1]
        result = process_input(input_string)
        domain, tld = preprocess(input_string)
        
        # Fetch DNS records for the genuine domain
        genuine_domain_dns = fetch_dns_records(input_string)

        # Generate typo-squatted domains
        typosquats = edit_one_letter(domain, tld)

        # Fetch DNS records for typo-squatted domains
        dns_records = fetch_all_dns_records(typosquats)

        # Add the genuine domain's DNS records as the first entry
        if genuine_domain_dns:
            dns_records.insert(0, genuine_domain_dns)

        # Save DNS records to CSV
        file_path = f"dynamic/phishoutput_{input_string}.csv"
        with open(file_path, 'w', newline='') as file:
            fieldnames = dns_records[0].keys()
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            for row in dns_records:
                writer.writerow({key: ', '.join(map(str, value)) if isinstance(value, list) else str(value) for key, value in row.items()})

        # Add resemblance scores
        add_resemble_score_to_csv(file_path)