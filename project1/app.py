from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    """Fake Cloudflare 'Verify you are human' page."""
    return render_template("index.html")


@app.route("/verified")
def rickroll():
    """The rick-roll reveal page."""
    return render_template("rickroll.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
