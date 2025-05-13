// src/types.ts
export type RootStackParamList = {
  Login: undefined; // Login screen does not have parameters
  SignUp: undefined;
  Dashboard: undefined; // Dashboard screen does not have parameters
  ForgotPassword: undefined;
  Profile: undefined;

  BuyStock: undefined;
  BuyCrypto: undefined;
  ManagePortfolio: undefined;

  DashboardManager: { managerID: string };
  EditClient: { clientId: string };
  BuyStockManager: { clientID: string};
  BuyCryptoManager: { clientID: string};
  ManagePortfolioClient: { clientID: string};

  Reviews: undefined;
};
