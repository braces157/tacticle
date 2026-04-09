IF OBJECT_ID('dbo.order_number_sequence', 'SO') IS NULL
BEGIN
    DECLARE @nextOrderNumber INT = (
        SELECT ISNULL(MAX(TRY_CAST(SUBSTRING(order_number, 4, 32) AS INT)), 2047) + 1
        FROM dbo.orders
    );

    DECLARE @sql NVARCHAR(MAX) =
        N'CREATE SEQUENCE dbo.order_number_sequence AS INT START WITH ' +
        CAST(@nextOrderNumber AS NVARCHAR(20)) +
        N' INCREMENT BY 1;';

    EXEC sp_executesql @sql;
END
