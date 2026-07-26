from dotenv import load_dotenv
import os

load_dotenv('.env')

vars = {
    "HOST": os.getenv("HOST"),
    "PORT": os.getenv("PORT"),
    "PROTCOL": os.getenv("PROTOCOL")
}