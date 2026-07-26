from flask import Flask, render_template
from config import vars

app = Flask(__name__, template_folder="static")

@app.route("/")
def welcome_api():
    return render_template('cloudflare.html')

@app.route('/rick-roll')
def rick_roll():
    return render_template('index.html')

if __name__ == "__main__":
    app.run("0.0.0.0", vars['PORT'], debug=True)