namespace backend.DTOs;

// What the frontend sends us to start a checkout
public class InitiatePaymentDto
{
    public decimal Amount { get; set; }
}

// What we hand back to the frontend to open the PayHere popup
public class PaymentCheckoutDto
{
    public string MerchantId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Amount { get; set; } = string.Empty;
    public string Currency { get; set; } = "LKR";
    public string Hash { get; set; } = string.Empty;
}

// What PayHere sends to our Notify URL after payment
public class PayHereNotifyDto
{
    public string merchant_id { get; set; } = string.Empty;
    public string order_id { get; set; } = string.Empty;
    public string payhere_amount { get; set; } = string.Empty;
    public string payhere_currency { get; set; } = string.Empty;
    public string status_code { get; set; } = string.Empty;
    public string md5sig { get; set; } = string.Empty;
}