from psycopg import Error, connect
from psycopg.rows import dict_row

from portal import create_app


def connect_db(config):
    return connect(**config['database'], row_factory=dict_row)


app = create_app(connect_db, Error)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8212)
