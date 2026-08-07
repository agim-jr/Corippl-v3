# backend/download_nltk_data.py
import nltk
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_nltk_packages():
    """Download NLTK packages required for the application."""
    packages = [
        'vader_lexicon',  # For sentiment analysis
        'punkt',          # For tokenization
        'stopwords',      # For text preprocessing
        'wordnet',        # For lemmatization
        'averaged_perceptron_tagger'  # For POS tagging
    ]

    for package in packages:
        logger.info(f"Downloading NLTK package: {package}")
        try:
            nltk.download(package)
            logger.info(f"Successfully downloaded NLTK package: {package}")
        except Exception as e:
            logger.error(f"Failed to download NLTK package {package}: {str(e)}")
            sys.exit(1)

def download_spacy_model():
    """Download the required spaCy model."""
    logger.info("Checking for spaCy model: en_core_web_sm")

    try:
        import spacy
        # Try to load the model to check if it's installed
        try:
            spacy.load("en_core_web_sm")
            logger.info("spaCy model en_core_web_sm is already installed")
        except:
            logger.info("Downloading spaCy model: en_core_web_sm")
            subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
            logger.info("Successfully downloaded spaCy model: en_core_web_sm")
    except ImportError:
        logger.error("spaCy is not installed. Please install it using: pip install spacy")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to download spaCy model: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    logger.info("Starting download of NLP resources...")
    download_nltk_packages()
    download_spacy_model()
    logger.info("All NLP resources downloaded successfully!")
