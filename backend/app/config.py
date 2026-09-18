from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-5.6-luna"
    auto_action_limit: float = 20.0
    protected_categories: str = "insurance,loan_payment,rent,utilities,healthcare"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def protected(self):
        return {x.strip().lower() for x in self.protected_categories.split(",") if x.strip()}

    @property
    def origins(self):
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

settings = Settings()
