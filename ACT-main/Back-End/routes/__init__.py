from flask import Blueprint

#from .register import bp as register_bp
#from .sign_in import bp as sign_in_bp
from .landing_page import bp as landing_page_bp
from .agent_data import bp as agent_data_bp
from .stock_data_routes import bp as stock_data_bp
from .crypto_data_route import bp as crypto_data_bp
from .chatbot_route import bp as chatbot_bp
from .paypal import bp as paypal_bp
#from .dashboard import bp as dashboard_bp
#from .reset_password import bp as reset_password_bp
#from .logout import bp as logout_bp
#from .change_password import bp as change_password_bp
bp = Blueprint('routes', __name__)

#bp.register_blueprint(register_bp)
#bp.register_blueprint(sign_in_bp)
bp.register_blueprint(landing_page_bp)
bp.register_blueprint(agent_data_bp)
bp.register_blueprint(stock_data_bp)
bp.register_blueprint(crypto_data_bp)
bp.register_blueprint(chatbot_bp)
bp.register_blueprint(paypal_bp)
#bp.register_blueprint(dashboard_bp)
#bp.register_blueprint(reset_password_bp)
#b#p.register_blueprint(logout_bp)
#bp.register_blueprint(change_password_bp)