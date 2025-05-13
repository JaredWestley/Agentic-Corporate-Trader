from flask import Blueprint, render_template, request, redirect, url_for, flash

bp = Blueprint('landing_page_bp', __name__)

@bp.route('/')
def landing():
    return "Home Page"