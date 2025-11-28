import React, { useState, useEffect } from 'react';
import { walletAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowDown, ArrowUp, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';

const Wallet = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await walletAPI.getTransactions();
      setTransactions(response.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const balance = transactions.reduce((acc, t) => {
    return t.transaction_type === 'credit' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="wallet-page">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6 pb-12">
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
          <p className="text-white/80 text-sm mb-2">Current Balance</p>
          <p className="text-4xl font-bold">₹{balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="-mt-6 px-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button className="btn-primary h-12">Add Money</Button>
          <Button variant="outline" className="h-12">Withdraw</Button>
        </div>

        <h2 className="text-lg font-semibold mb-3">Transaction History</h2>
        
        {loading ? (
          <div className="text-center py-8 text-foreground-muted">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <WalletIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-foreground-muted">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.transaction_type === 'credit' ? 'bg-accent/10' : 'bg-destructive/10'
                  }`}>
                    {transaction.transaction_type === 'credit' ? (
                      <ArrowDown className="w-5 h-5 text-accent" />
                    ) : (
                      <ArrowUp className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{transaction.description}</h3>
                    <p className="text-xs text-foreground-muted">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-lg font-bold ${
                    transaction.transaction_type === 'credit' ? 'text-accent' : 'text-destructive'
                  }`}>
                    {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;