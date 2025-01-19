exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed"
        };
    }

    // Get the password from the Authorization header
    const authorization = event.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            body: "Unauthorized"
        };
    }

    const password = authorization.split('Bearer ')[1];
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (password === ADMIN_PASSWORD) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password verified" })
        };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "Invalid password" })
        };
    }
}; 