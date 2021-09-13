> implement jwt in nodejs

#### JWT - draft

##### Thành phần cơ bản của mã jwt

- header: chứa các thông tin về type, algorithm.
- payload: chứa thông tin sẽ được lưu trong `jwt`.
- signature: phần đc mã hoá base64 chuỗi đc hash từ header(base64) và payload(base64) và 1 secret key .
