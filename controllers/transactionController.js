const Transaction = require('../models/Transaction');
const ResponseHandler = require('../utils/responseHandler');
const CustomError = require('../utils/customError');

// Transaction controller for payment operations
class TransactionController {

    // Admin: all transactions | User: own transactions
    static async listTransactions(req, res, next) {
        try {
            const query = req.user.role === 'admin'
                ? {}
                : { userId: req.user._id };

            const transactions = await Transaction.find(query)
                .populate('userId', 'name email')
                .populate('courseId', 'title')
                .populate('couponId', 'code')
                .lean();

            ResponseHandler.success(
                res,
                { transactions },
                'Transactions retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    // All previous transactions for logged-in user
    static async userTransactions(req, res, next) {
        try {
            const transactions = await Transaction.find({ userId: req.user._id })
                .populate('courseId', 'title')
                .populate('couponId', 'code')
                .lean();

            if (!transactions || transactions.length === 0) {
                throw new CustomError('No transactions found for this user', 404);
            }

            ResponseHandler.success(
                res,
                { transactions },
                'User transactions retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    // Transaction details by ID
    static async getTransactionDetails(req, res, next) {
        try {
            const { transactionId } = req.params;

            // Validate ObjectId format
            if (!transactionId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new CustomError('Invalid transaction ID', 400);
            }

            const transaction = await Transaction.findById(transactionId)
                .populate('userId', 'name email')
                .populate('courseId', 'title')
                .populate('couponId', 'code')
                .lean();

            if (!transaction) {
                throw new CustomError('Transaction not found', 404);
            }

            // Access control: users can only view their own transactions
            if (req.user.role !== 'admin' &&
                transaction.userId._id.toString() !== req.user._id.toString()) {
                throw new CustomError('Access denied', 403);
            }

            ResponseHandler.success(
                res,
                { transaction },
                'Transaction details retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TransactionController;