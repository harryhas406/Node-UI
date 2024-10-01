import json
import datetime
import plotly.express as px
import plotly.io as pio
import pandas as pd
import requests

def download_latest_data():
    print("[*] Downloading most recent RansomWatch data...")
    # Set the URL of the file to download
    url = 'https://data.ransomware.live/posts.json'

    # Send a GET request to the URL
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        # Save the file to the current working directory
        with open('posts.json', 'w') as f:
            f.write(response.text)
    else:
        print('Failed to download file:', response.status_code)
    # Load the JSON file
    with open('posts.json', 'r') as f:
        data = json.load(f)
    return data

def run_data_viz(data):
    print("[*] Creating bar chart for the last 7 days")

    # Get the current date
    now = datetime.datetime.now()
    days_filter = 7
    # Filter the data to only include posts from the past 7 days
    filtered_data = [post for post in data if (now - datetime.datetime.fromisoformat(post['discovered'])).days < days_filter]

    # Extract the group names and timestamps into separate lists
    group_names = []
    for post in filtered_data:
        group_names.append(post['group_name'])

    # Convert the list into a Pandas dataframe
    df = pd.DataFrame({'group_name': group_names})

    # Group and sort the data by the number of postings in each group
    df_sorted = df.groupby('group_name').size().reset_index(name='count').sort_values(by='count', ascending=True)

    # Use Plotly's Bar plot to create the bar chart
    fig = px.bar(df_sorted, x='group_name', y='count', color='count', title='Posting Frequency by Group (Last 7 Days)', color_continuous_scale='Portland', template='plotly_dark')

    # Update the layout to change the background color
    fig.update_layout(
        plot_bgcolor='rgba(0, 0, 0, 0)',  # Change plot background color
        paper_bgcolor='rgba(0, 0, 0, 0)',  # Change paper background color
        title_font=dict(color='white'),  # Title font color
        xaxis_title_font=dict(color='white'),  # X-axis title font color
        yaxis_title_font=dict(color='white'),  # Y-axis title font color
        legend_title_font=dict(color='white'),  # Legend title font color
        font=dict(color='white'),  # Font color
    )

    filename = "bar_chart_last_7_days.html"
    pio.write_html(fig, file=filename)

    print("[!] Finished writing Plotly data to disk!")

data = download_latest_data()
run_data_viz(data)
