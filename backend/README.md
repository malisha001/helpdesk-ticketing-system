<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Ticket attachments

Ticket creation accepts optional `attachments[]` multipart uploads alongside `subject`, `description` and `priority`. JSON creation without files remains supported. Defaults are five files, 5 MB (5120 KB) each, with PDF, PNG, JPG/JPEG, TXT, DOC and DOCX allowed. Laravel validates successful uploads, file contents, extensions, count and size.

Apply the additive migration from the backend directory:

```sh
php artisan migrate --path=database/migrations/2026_10_31_185526_create_ticket_attachments_table.php
```

The existing `ticket_attachments` table stores metadata with indexed foreign keys to tickets and uploaders, including each file's storage disk and object path. Ticket deletion cascades metadata; uploader deletion is restricted. No existing tickets or assignment records are modified. New files use `TICKET_ATTACHMENTS_DISK` (default `local`) under `ticket-attachments/{ticketId}/{generatedFilename}`. Local files live in `storage/app/private`; do not expose this directory through a web-server alias or public symlink. No `storage:link` command is required for attachments. On Windows, restrict filesystem access using the host's ACLs; Unix visibility bits are not available there.

### Cloudflare R2 setup

The `r2` disk in `config/filesystems.php` uses Laravel's S3-compatible driver, region `auto`, private visibility and `throw => true` so failed storage operations raise exceptions. Run `composer install` to install the locked dependencies, including `league/flysystem-aws-s3-v3` and its AWS SDK dependency, and generate their autoloader. Attachment disk selection is independent of `FILESYSTEM_DISK`.

1. In Cloudflare's **R2 Object Storage** dashboard, enable R2 if needed and create a bucket for ticket attachments.
2. Keep the bucket private: leave the **Public Development URL** (`r2.dev`) disabled and do not connect a public custom domain.
3. Under **Manage API Tokens**, create an R2 token with **Object Read & Write**, scoped to this bucket. Save its **Access Key ID** and **Secret Access Key** in backend environment settings or a secret manager, never in source control or frontend variables.
4. Copy the bucket's S3 API endpoint. Normally this is `https://<account-id>.r2.cloudflarestorage.com`; use the dashboard's jurisdiction-specific endpoint if applicable. Do not append the bucket name or use an `r2.dev` URL.

Configure these backend environment variables (blank values below are placeholders):

```dotenv
TICKET_ATTACHMENTS_DISK=r2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

After configuring them, run `php artisan config:clear` in development, or rebuild production configuration with `php artisan config:cache`, and restart long-running application/queue workers. Set `TICKET_ATTACHMENTS_DISK=local` for local development without R2. Keep real credentials in the untracked `.env` file or the deployment's secret settings.

If PHP reports cURL error 60 because it has no trusted CA store configured, set the optional backend `R2_CA_BUNDLE` variable to an absolute path to a trusted PEM CA bundle readable by the PHP process. Leave it empty on hosts with working system CA configuration. The path is machine-specific and belongs only in that environment's settings. TLS certificate verification remains enabled; do not disable it to work around certificate errors. See [Guzzle's certificate verification options](https://docs.guzzlephp.org/en/stable/request-options.html#verify).

Uploads still go through the existing ticket creation endpoint and `StoreTicketRequest` validation. The attachment service uploads generated filenames and saves the selected disk and path in the existing database transaction. Downloads still pass through Laravel authentication, ticket authorization and attachment-to-ticket ownership checks before streaming from the stored disk and path. No public object URLs, browser-to-R2 transfers, presigned URLs or bucket CORS setup are required for this server-side flow.

Switching the upload disk does not modify existing attachment records or files. Keep the original disk configuration and local storage available for older downloads, including when deploying to another server. Switching back to `local` affects only new uploads; keep R2 credentials available while R2 records exist. No data migration is performed. Any future migration must separately copy and verify objects before changing individual records, with backups and a rollback plan.

Before enabling production uploads, create a ticket with an attachment, confirm the generated object in the private bucket and its `r2` database record, and download it as its owner. Verify that another customer cannot download it and that an older local attachment still downloads. Automated tests use storage fakes and do not establish live R2 connectivity.

References: [Cloudflare R2 authentication and bucket-scoped tokens](https://developers.cloudflare.com/r2/api/tokens/), [public bucket settings](https://developers.cloudflare.com/r2/buckets/public-buckets/), and [Laravel filesystem configuration](https://laravel.com/docs/13.x/filesystem).

### Upload limits and failure handling

Configure backend limits in `config/ticket_attachments.php` and keep the browser hints in `frontend/features/tickets/attachments.ts` aligned. Any replacement disk must remain private. The Next.js creation proxy currently allows a declared request size up to 30 MB; raise that limit too if attachment limits change.

Before testing uploads at the supported limits, update the PHP configuration used by the running web server (`php --ini` identifies the CLI configuration):

```ini
upload_max_filesize = 5M
post_max_size = 30M
max_file_uploads = 20
```

Restart PHP/the development server after changing these settings. This machine's inspected CLI configuration, `C:\php-8.3.8\php.ini`, currently has `upload_max_filesize=2M` and `post_max_size=8M`; those values are too small for the feature's maximums. The application does not modify machine-wide PHP settings. Configure any reverse proxy or hosting request-body limit to at least 30 MB (for example, nginx `client_max_body_size 30m`) and allow sufficient upload time. PHP's temporary upload directory and `storage/app/private` must be writable by the PHP process.

Ticket details expose only attachment ID, original name, server-detected MIME type, size and an authenticated download reference. `GET /api/tickets/{id}/attachments/{attachment}/download` reuses the existing `ShowTicketHandler` access rules, verifies attachment ownership by the ticket, and streams the file as a download. The corresponding Next.js route forwards the HttpOnly token server-side and streams the binary response with private/no-store headers.

Creation keeps ticket, history and attachment metadata in the existing database transaction. On storage or metadata failure it rolls back the records and explicitly deletes only paths generated during that request from their recorded disk, including a partially written file. Database rollback alone cannot remove R2 objects. Cleanup errors are reported to the Laravel log and cleanup continues with the remaining paths. Notifications remain outside this transaction; a notification transport failure does not delete already committed attachments. As before, such a notification failure can return an error after the ticket has been saved. Back up private files together with database metadata. A process crash or unavailable filesystem during cleanup can require operator reconciliation: compare objects against attachment records and review failed-request logs before removing any orphan. Do not delete whole ticket directories or change existing disk values as a cleanup shortcut.

Focused tests use isolated storage and the in-memory test database:

```sh
php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/phpunit tests/Feature/Http/Controllers/TicketAttachmentControllerTest.php
```

The extension flags are needed only when SQLite is not already enabled. From `frontend`, run `npx tsc --noEmit`. Manual browser testing should include five 5 MB files, removal before submission, Laravel validation feedback, and authorized/unauthorized downloads. Reply attachments are outside this feature.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
