# Multi-server deployment and Cloudflare R2

This application can run behind a shared load balancer with media in Cloudflare R2. The repository changes make that deployment possible; they do not provision or size cloud resources. A target of 2,000 simultaneous users must be confirmed with a load test using the real workload, request mix, and media sizes.

## Production shape

- Put at least two identical Laravel/PHP-FPM app instances behind a health-checked load balancer. The load balancer should check `/up`, terminate TLS, and be the only network path to the app instances.
- Use one highly available MySQL or PostgreSQL database shared by all instances. SQLite is only suitable for local development. Tune database connection limits for the combined PHP-FPM and worker process count.
- Use a shared Redis service for sessions, cache, and queues. Run queue workers as separate processes/services and restart them on deploy. Do not use file sessions/cache on app replicas.
- Keep the app code and built frontend assets identical on all replicas. Run migrations once per deployment, then warm Laravel config/routes/views caches. Do not run migrations independently on every instance.
- Store logs centrally and set health checks, alerts, database/Redis backups, and autoscaling limits. Size PHP-FPM workers from measured memory per worker and the instance memory budget.
- Configure `TRUSTED_PROXIES` with the load balancer's private IPs/CIDRs so Laravel recognizes HTTPS and the original client IP. Restrict ingress so clients cannot bypass that proxy.

## Step-by-step Cloudflare R2 setup

### 1. Create two R2 buckets

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com/) and open **Storage & databases → R2 Object Storage**.
2. Select **Create bucket** and create one bucket for public images, for example `uvll-public-media`.
3. Create a second bucket for private course files and videos, for example `uvll-private-media`.
4. Leave public access disabled on the private bucket. Do not attach a public domain to it.

R2 buckets are private until you explicitly enable public access. See Cloudflare's [bucket creation and R2 S3 setup guide](https://developers.cloudflare.com/r2/get-started/s3/).

### 2. Create an R2 S3 API token

1. On the R2 Overview page, select **Manage R2 API Tokens** (the label may appear as **Manage in API Tokens**).
2. Create an account or user API token with **Object Read & Write** access.
3. Scope it to just the public and private buckets you created.
4. Create the token and immediately copy its **Access Key ID** and **Secret Access Key** into your hosting provider's secret manager. Cloudflare only displays the secret once.
5. Copy the S3 API endpoint shown by Cloudflare. It has the form `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

The app uses this S3-compatible endpoint and R2's required region value, `auto`. See [Cloudflare R2 S3 credentials](https://developers.cloudflare.com/r2/get-started/s3/) and [R2 token permissions](https://developers.cloudflare.com/r2/api/tokens/).

### 3. Attach a public media domain

1. Make sure your domain is added to the same Cloudflare account as the buckets. For example, use a subdomain such as `media.your-domain.example`.
2. Open the **public bucket → Settings → Custom Domains → Add**.
3. Enter the media subdomain and select **Connect Domain**. Wait for its status to become **Active**.
4. Use that exact HTTPS domain for `R2_PUBLIC_URL` below.
5. Do not enable a public development `r2.dev` URL for production. The public bucket's custom domain makes every object in that bucket public, so put only public images there.

Follow Cloudflare's [custom domain instructions](https://developers.cloudflare.com/r2/buckets/public-buckets/#connect-a-bucket-to-a-custom-domain). Custom domains require a domain/zone in the same Cloudflare account.

### 4. Add the CORS policy

For each bucket, open **Settings → CORS Policy → Add CORS policy**, choose the JSON editor, and save a policy like this. Replace the origin with the exact scheme and hostname of the web app (no path or trailing slash).

```json
[
  {
    "AllowedOrigins": ["https://your-domain.example"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range", "Content-Type"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

This covers browser reads and video range requests. The current app sends uploads through Laravel, so it does not need browser `PUT` access to R2. Add `PUT` only if you later implement direct browser uploads, and then scope CORS to the app origin and required headers. See [R2 CORS configuration](https://developers.cloudflare.com/r2/buckets/cors/).

### 5. Configure the Laravel app

Use secrets from the hosting platform's secret manager; do not commit them to `.env.example` or source control. Set these values for **every** app instance:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example
DB_CONNECTION=mysql
DB_HOST=your-managed-db.internal
DB_PORT=3306
DB_DATABASE=uvlifelonglearning
DB_USERNAME=...
DB_PASSWORD=...
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=your-managed-redis.internal
REDIS_PASSWORD=...
TRUSTED_PROXIES=10.0.0.0/8
MEDIA_PUBLIC_DISK=r2
MEDIA_PRIVATE_DISK=r2_private
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BUCKET=uvll-public-media
R2_PRIVATE_BUCKET=uvll-private-media
R2_PUBLIC_URL=https://media.your-domain.example
```

Set the values as follows:

- `R2_ENDPOINT`: the S3 endpoint from step 2, including `https://`.
- `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: the credentials from step 2.
- `R2_PUBLIC_BUCKET` and `R2_PRIVATE_BUCKET`: the exact bucket names from step 1.
- `R2_PUBLIC_URL`: the HTTPS custom domain from step 3, with no trailing slash or bucket name.
- `MEDIA_PUBLIC_DISK=r2` and `MEDIA_PRIVATE_DISK=r2_private`.

Then deploy the same environment values to every replica and refresh cached Laravel config (for example, run `php artisan config:cache` during the release). Laravel creates ten-minute signed download URLs for private files only after its normal course access checks. For large videos, direct-to-R2 multipart uploads would avoid routing large request bodies through PHP; the current app uploads through Laravel and caps each file at 200 MB.

### 6. Copy existing uploaded files

Before turning on the R2 disk settings, back up the database and local `storage/app/public` and `storage/app/private` folders. Copy the contents of `storage/app/public` into the public bucket and the contents of `storage/app/private` into the private bucket, preserving every relative object path. For example, a local `storage/app/private/course-materials/12/video.mp4` must become the R2 key `course-materials/12/video.mp4`. Use a tool that supports the R2 S3 endpoint (such as `rclone` or AWS CLI configured with the R2 endpoint), and verify object counts and sample files before switching production traffic.

The app's database already stores relative object paths, so preserving those keys keeps existing records working. Keep the local backup until you have verified banners/images, private downloads, video playback and seeking, and new uploads in production.

### 7. Verify the connection

1. Upload a test image in the admin course catalog and confirm its URL starts with `R2_PUBLIC_URL` and opens over HTTPS.
2. Upload a small course material and verify an enrolled student can view/download it while an unauthorized user receives the app's normal access denial.
3. Upload and play a short video; test seeking near the middle so you verify byte-range playback.
4. Check the private R2 bucket has no public custom domain or `r2.dev` access enabled.
5. Check application logs for S3 signature, permission, or CORS errors. If you changed CORS after assets were cached, purge the relevant Cloudflare cache as described in the [CORS docs](https://developers.cloudflare.com/r2/buckets/cors/).

## Capacity validation

“2,000 users at the same time” is not a fixed server size: 2,000 logged-in users browsing occasionally differs from 2,000 users continuously uploading or streaming. Before launch, load test the full stack with realistic login, course pages, database writes, uploads, and video playback. Track request latency/error rate, CPU and memory per replica, DB connections/query latency, Redis latency, and queue depth. Increase replicas or database/cache capacity based on bottlenecks and repeat the test through expected peak and failure scenarios.
