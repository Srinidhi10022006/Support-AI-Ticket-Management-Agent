from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file
DATABASE_URL = "sqlite:///pulsedesk.db"

# Create database engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create session
SessionLocal = sessionmaker(bind=engine)

# Base class
Base = declarative_base()


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True)
    name = Column(String)
    emp_id = Column(String)
    department = Column(String)

    title = Column(String)
    description = Column(Text)

    category = Column(String)
    priority = Column(String)
    sentiment = Column(String)

    routed_team = Column(String)
    summary = Column(Text)

    status = Column(String)


# Create the database tables
Base.metadata.create_all(bind=engine)
