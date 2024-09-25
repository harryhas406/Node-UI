import sys
import os
import subprocess
import csv
import requests
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from concurrent.futures import ThreadPoolExecutor, as_completed

def process_input(input_string: str) -> str:
    # Process the input string here
    return f"Processed input: {input_string}"

def fetch_page_content(domain):
    """Fetch the page content of a domain"""
    try:
        response = requests.get(f"http://{domain}", timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        return domain, soup.get_text()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {domain}: {e}")
        return domain, None

def calculate_similarity_score(content1, content2):
    """Calculate the similarity score between two pages using TF-IDF and cosine similarity"""
    if content1 and content2:
        documents = [content1, content2]
        tfidf_vectorizer = TfidfVectorizer().fit_transform(documents)
        cosine_sim = cosine_similarity(tfidf_vectorizer[0:1], tfidf_vectorizer[1:2])
        return cosine_sim[0][0]
    return 0.0

def fetch_all_domains_content(domains):
    """Fetch content for all domains in parallel using multi-threading"""
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_domain = {executor.submit(fetch_page_content, domain): domain for domain in domains}
        results = {}
        for future in as_completed(future_to_domain):
            domain, content = future.result()
            results[domain] = content
        return results

def add_resemble_score_to_csv(csv_file_path):
    """Reads the CSV file, fetches page content, and calculates resemblance score"""
    new_rows = []
    
    # Open the CSV to fetch the domains
    with open(csv_file_path, mode='r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        rows = list(csv_reader)

        if rows:
            # Get all domains including genuine and related domains
            domains = [row['Domain'] for row in rows]
            
            # Fetch content for all domains in parallel
            contents = fetch_all_domains_content(domains)

            # Use the content from the first row as the genuine domain content
            genuine_domain = rows[0]['Domain']
            genuine_content = contents[genuine_domain]

            fieldnames = csv_reader.fieldnames + ['Resemble Score']  # Add new column

            # Calculate resemblance score for each domain and add to the row
            for row in rows:
                related_domain = row['Domain']
                related_content = contents[related_domain]
                resemble_score = calculate_similarity_score(genuine_content, related_content)
                # row['Resemble Score'] = round(resemble_score,3) # Round to 3 decimal places
                resemble_score_percentage = round(resemble_score*100, 3)
                row['Resemble Score'] = f"{resemble_score_percentage}"
                new_rows.append(row)

    # Write the new rows with the resemble_score column back to the CSV file
    with open(csv_file_path, mode='w', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)

    print(f"Updated CSV saved with resemblance scores.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_string = sys.argv[1]
        result = process_input(input_string)
        file_path = "dynamic/phishoutput_" + input_string + ".csv"
        print(result)

        # Run the phishing.py script and generate the temporary output file
        status, output = subprocess.getstatusoutput("python3 phishing_new.py -f csv --registered --geoip --whois " + input_string + " > " + file_path + "_temp")
        
        if not status:
            print("success")

            # Open the temp file and output file for reading and writing
            with open(file_path + "_temp", "r") as read_file, open(file_path, "w", newline='') as write_file:
                reader = csv.reader(read_file)
                writer = csv.writer(write_file)

                ip6exist = True
                for count, row in enumerate(reader):
                    if count == 0:
                        # Modify the header to include Location, CreatedOn, and Registrar
                        if "dns_aaaa" in row:
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
            
            # Add the resemblance score to the CSV file
            add_resemble_score_to_csv(file_path)