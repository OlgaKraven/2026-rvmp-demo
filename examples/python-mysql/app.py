from mysql.connector import Error, connect

from portal import create_app


def connect_db(config):
    return connect(**config['database'], charset='utf8mb4')


app = create_app(connect_db, Error, dictionary=True)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8213)
