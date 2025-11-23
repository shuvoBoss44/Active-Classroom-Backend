class ResponseHandler {
    static success(res, data, message = "Success") {
        res.status(200).json({
            success: true,
            status: "success",
            message,
            data,
        });
    }

    static created(res, data, message = "Resource created successfully") {
        res.status(201).json({
            success: true,
            status: "success",
            message,
            data,
        });
    }

    static noContent(res, message = "No content") {
        res.status(204).json({
            success: true,
            status: "success",
            message,
        });
    }

    static error(res, message, statusCode = 400) {
        res.status(statusCode).json({
            success: false,
            status: "fail",
            message,
        });
    }
}

module.exports = ResponseHandler;