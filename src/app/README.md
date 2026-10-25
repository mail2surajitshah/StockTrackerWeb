# Stock Manager (Angular + .NET Core API)

A small Angular app (standalone components, signals, reactive forms) that lists, adds, updates and deletes stock records through a .NET Core Web API.

## What's included

```
src/
  main.ts
  environments/environment.ts      API base URL
  app/
    app.component.ts               Shell
    app.config.ts                  provideHttpClient()
    stock.model.ts                 Stock interface
    stock.service.ts               HTTP calls to /api/stocks
    stock-list.component.*         List + add/edit form
proxy.conf.json                    Dev proxy to the .NET API
```

## 1. Create the Angular project and drop these files in

```bash
npm install -g @angular/cli
ng new stock-app --standalone --routing=false --style=css
cd stock-app
# copy the files from this folder over the generated ones
```

Run with the dev proxy (avoids CORS in development):

```bash
ng serve --proxy-config proxy.conf.json
```

Edit the `target` in `proxy.conf.json` to match the port your API listens on (check `launchSettings.json`).

## 2. API contract the app expects

| Method | Route               | Body    | Response            |
|--------|---------------------|---------|---------------------|
| GET    | `/api/stocks`       |         | `200` `Stock[]`     |
| GET    | `/api/stocks/{id}`  |         | `200` `Stock`       |
| POST   | `/api/stocks`       | `Stock` | `201` `Stock`       |
| PUT    | `/api/stocks/{id}`  | `Stock` | `204`               |
| DELETE | `/api/stocks/{id}`  |         | `204`               |

JSON shape (camelCase, which is the ASP.NET Core default):

```json
{ "id": 1, "symbol": "MSFT", "name": "Microsoft", "quantity": 10, "price": 415.25 }
```

## 3. Minimal .NET controller (reference)

```csharp
public class Stock
{
    public int Id { get; set; }
    public string Symbol { get; set; } = "";
    public string Name { get; set; } = "";
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class StocksController : ControllerBase
{
    private static readonly List<Stock> _stocks = new()
    {
        new() { Id = 1, Symbol = "MSFT", Name = "Microsoft", Quantity = 10, Price = 415.25m },
        new() { Id = 2, Symbol = "AAPL", Name = "Apple", Quantity = 5, Price = 228.10m }
    };

    [HttpGet] public ActionResult<IEnumerable<Stock>> GetAll() => _stocks;

    [HttpGet("{id}")]
    public ActionResult<Stock> Get(int id) =>
        _stocks.FirstOrDefault(s => s.Id == id) is { } s ? s : NotFound();

    [HttpPost]
    public ActionResult<Stock> Create(Stock stock)
    {
        stock.Id = _stocks.Count == 0 ? 1 : _stocks.Max(s => s.Id) + 1;
        _stocks.Add(stock);
        return CreatedAtAction(nameof(Get), new { id = stock.Id }, stock);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, Stock stock)
    {
        var existing = _stocks.FirstOrDefault(s => s.Id == id);
        if (existing is null) return NotFound();
        existing.Symbol = stock.Symbol;
        existing.Name = stock.Name;
        existing.Quantity = stock.Quantity;
        existing.Price = stock.Price;
        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var existing = _stocks.FirstOrDefault(s => s.Id == id);
        if (existing is null) return NotFound();
        _stocks.Remove(existing);
        return NoContent();
    }
}
```

The in-memory list is for demonstration; swap it for EF Core in a real project.

## 4. CORS (only if you skip the proxy)

In the API's `Program.cs`:

```csharp
builder.Services.AddCors(o => o.AddPolicy("ng", p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

// ...after var app = builder.Build();
app.UseCors("ng");
```

Then set `apiUrl` in `src/environments/environment.ts` to your API's URL (for example `https://localhost:7001`) and run plain `ng serve`.
