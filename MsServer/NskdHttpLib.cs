using Nskd.Data;
using System;
using System.Data;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;

namespace Nskd.HttpLib
{
    class HttpClient
    {
        private String siteUriPrefix;

        public HttpClient(String host, UInt32 port)
        {
            siteUriPrefix = "http://" + host + ":" + port.ToString();
        }

        /// <summary>
        /// Из входящего запроса от пользователя делает исходящий запрос на сайт.
        /// Возвращает ответ от сайта.
        /// </summary>
        /// <param name="incomingRequest"></param>
        /// <returns></returns>
        public HttpWebResponse GetResponse(HttpListenerContext context, String sessionId = null, MemoryStream ms = null)
        {
            HttpWebResponse incomingResponse = null;

            HttpListenerRequest incomingRequest = context.Request;
            
            String requestUri = siteUriPrefix + incomingRequest.Url.PathAndQuery;
            
            HttpWebRequest outcomingRequest = (HttpWebRequest)WebRequest.Create(requestUri);
            
            outcomingRequest.Method = incomingRequest.HttpMethod;

            CopyHeaders(incomingRequest, outcomingRequest);

            //outcomingRequest.Credentials = CredentialCache.DefaultCredentials;
            
            if (incomingRequest.HttpMethod == "POST")
            {
                if (ms == null)
                {
                    ms = new MemoryStream();
                    incomingRequest.InputStream.CopyTo(ms);
                    ms.Position = 0;
                }
                
                if (sessionId != null)
                {
                    // добавляем информацию о сессии (пока в формате Forms, потом добавим JSON и XML)
                    String s = "SessionId=" + sessionId;
                    if (ms.Length > 0) { s = "&" + s; }
                    Byte[] buff = Encoding.UTF8.GetBytes(s);
                    ms.Position = ms.Length;
                    ms.Write(buff, 0, buff.Length);
                }
                /*
                // это только для распечатки
                {
                    MemoryStream ms2 = new MemoryStream();
                    ms.Position = 0;
                    ms.CopyTo(ms2);
                    ms.Position = 0;
                    ms2.Position = 0;
                    using (StreamReader sr = new StreamReader(ms2, Encoding.UTF8))
                    {
                        Console.WriteLine("inf: " + sr.ReadToEnd());
                    }
                }
                */
                outcomingRequest.ContentLength = ms.Length;
                ms.Position = 0;
                ms.CopyTo(outcomingRequest.GetRequestStream());
                outcomingRequest.GetRequestStream().Close();
            }
            try
            {
                incomingResponse = (HttpWebResponse)outcomingRequest.GetResponse();
            }
            catch (WebException e)
            {
                HttpStatusCode code = ((HttpWebResponse)e.Response).StatusCode;
                if (code == HttpStatusCode.NotModified) // 304
                {
                    context.Response.StatusCode = 304;
                    context.Response.OutputStream.Close();
                }
                else if (code == HttpStatusCode.NotFound) // 404
                {
                    context.Response.StatusCode = 404;
                    context.Response.OutputStream.Close();
                }
                else
                {
                    Console.WriteLine("e> {0:yyyy-MM-dd HH:mm:ss} {1}: {2}", DateTime.Now, "HttpClient.GetResponse()", e.Message);
                    throw e;
                }
            }
            return incomingResponse;
        }

        private void CopyHeaders(HttpListenerRequest incomingRequest, HttpWebRequest outcomingRequest)
        {
            outcomingRequest.Headers = new WebHeaderCollection();
            foreach (String h in incomingRequest.Headers)
            {
                try
                {
                    switch (h)
                    {
                        case "Accept":
                            outcomingRequest.Accept = incomingRequest.Headers[h];
                            break;
                        case "Connection":
                            //outcomingRequest.Connection = incomingRequest.Headers[h];
                            break;
                        case "Content-Length":
                            outcomingRequest.ContentLength = long.Parse(incomingRequest.Headers[h]);
                            break;
                        case "Content-Type":
                            outcomingRequest.ContentType = incomingRequest.Headers[h];
                            break;
                        case "Host":
                            outcomingRequest.Host = incomingRequest.Headers[h];
                            break;
                        case "If-Modified-Since":
                            // обновляем всегда
                            //outcomingRequest.IfModifiedSince = DateTime.Parse(incomingRequest.Headers[h]);
                            break;
                        case "KeepAlive":
                            // соединение каждый раз закрываем
                            outcomingRequest.KeepAlive = false;
                            break;
                        case "Referer":
                            outcomingRequest.Referer = incomingRequest.Headers[h];
                            break;
                        case "User-Agent":
                            outcomingRequest.UserAgent = incomingRequest.Headers[h];
                            break;
                        default:
                            outcomingRequest.Headers.Add(h, incomingRequest.Headers[h]);
                            break;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine("Nskd.HttpLib.HttpClient.GetResponse(): " + e.ToString());
                }
            }
        }
    }
    class HttpServer
    {
        private HttpListener listener;

        public delegate void RequestDelegate(HttpListenerContext context);
        public event RequestDelegate OnIncomingRequest;

        public HttpServer() { }

        // Запуск сервера
        public void Start(String uriPrefix)
        {
            Console.WriteLine("d> Proxy: Start on " + uriPrefix + ".");

            listener = new HttpListener();
            listener.Prefixes.Add(uriPrefix);
            listener.Start();

            // Определим нужное количество потоков (соединений)
            ThreadPool.SetMaxThreads(32, 32);
            ThreadPool.SetMinThreads(2, 2);
            
            // В бесконечном цикле
            while (true)
            {
                // Принимаем новых клиентов. После того, как клиент был принят, он передается в новый поток 
                // с использованием пула потоков.
                ThreadPool.QueueUserWorkItem(new WaitCallback(AcceptCompleted), listener.GetContext());
            }
        }

        // Остановка сервера
        ~HttpServer()
        {
            // Если "слушатель" был создан
            if (listener != null)
            {
                // Остановим его
                listener.Stop();
            }
        }

        /// <summary>
        /// This method is the callback method associated with Socket.AcceptAsync  
        /// operations and is invoked when an accept operation is complete 
        /// </summary>
        private void AcceptCompleted(Object context)
        {
            //Console.WriteLine("d> AcceptCompleted");
            ProcessRequest((HttpListenerContext)context);
        }

        private void ProcessRequest(HttpListenerContext context)
        {
            OnIncomingRequest(context);
        }

        /// <summary>
        /// Из входящего ответа от сайта делает исходящий ответ для пользователя.
        /// Копирует заголовки, а если есть, то и тело ответа.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="incomingResponse"></param>
        public void SendResponse(HttpListenerContext context, HttpWebResponse incomingResponse)
        {
            WebHeaderCollection headers = incomingResponse.Headers;
            headers.Remove("Content-Length"); // Этот заголовок нельзя передавать в комплекте.
            context.Response.Headers = headers;
            if (incomingResponse.ContentLength > 0)
            {
                Stream receiveStream = incomingResponse.GetResponseStream();
                MemoryStream ms = new MemoryStream();
                receiveStream.CopyTo(ms);
                context.Response.ContentLength64 = ms.Length; // Восстанавливаем Content-Length
                ms.Position = 0;
                try
                {
                    ms.CopyTo(context.Response.OutputStream);
                }
                catch (Exception ex) { Console.WriteLine("e>{0:yyyy-MM-dd HH:mm:ss} SendResponse(): {1} {2}", DateTime.Now , ex.Message, context.Response.RedirectLocation); }
            }
            context.Response.OutputStream.Close();
        }

        /// <summary>
        /// Отправляет страницу с перенаправлением.
        /// </summary>
        public void SendRedirectPage(HttpListenerContext context)
        {
            string html = @"
                <!DOCTYPE HTML>
                <html>
                    <head>
                        <title>Redirect page</title>
                        <meta charset=""utf-8"">
                        <meta http-equiv=""refresh"" content=""3;http://192.168.135.14/"">
                    </head>
                    <body>
                        <div>Сайт переехал на новый адрес <a href=""http://192.168.135.14/"">http://192.168.135.14/</a>.</div>
                        <div>Через три секунды это страница будет заменена на новую.</div>
                    </body>
                </html>
            ";
            byte[] buff = Encoding.UTF8.GetBytes(html);
            try
            {
                context.Response.OutputStream.Write(buff, 0, buff.Length);
            }
            catch (Exception ex) { Console.WriteLine("e> SendErrorPage(): " + ex.Message); }
            context.Response.OutputStream.Close();
        }

        /// <summary>
        /// Отправляет страницу с описанием ошибки и закрывает поток ответа.
        /// </summary>
        public void SendErrorPage(HttpListenerContext context, HttpStatusCode status)
        {
            string codeStr = ((int)status).ToString() + " " + status.ToString();
            string html = "<html><body><h1>" + codeStr + "</h1></body></html>";
            byte[] buff = Encoding.UTF8.GetBytes(html);
            try
            {
                context.Response.OutputStream.Write(buff, 0, buff.Length);
            }
            catch (Exception ex) { Console.WriteLine("e> SendErrorPage(): " + ex.Message); }
            context.Response.OutputStream.Close();
        }

        public void SendLoginPage(HttpListenerContext context, String sessionId, String rsaModule, String rsaExponent)
        {
            String fileName = AppDomain.CurrentDomain.BaseDirectory + @"Login\Login.html";
            FileInfo fi = new FileInfo(fileName);
            if (fi.Exists)
            {
                StringBuilder html = null;
                using (FileStream fs = fi.OpenRead())
                {
                    StreamReader sr = new StreamReader(fs, Encoding.UTF8);
                    html = new StringBuilder(sr.ReadToEnd());
                }
                html.Replace("ed6cc241-348a-48d8-f0ab-6a4f2aed179e", sessionId);
                html.Replace("1c5942a1-6196-418f-aeda-523a46a81727", rsaModule);
                html.Replace("a0d9dbe6-6a6b-460c-b4e6-ede820e3b9cf", rsaExponent);

                Byte[] buff = Encoding.UTF8.GetBytes(html.ToString());
                context.Response.ContentEncoding = Encoding.UTF8;
                context.Response.ContentLength64 = buff.Length;
                context.Response.ContentType = "text/html";
                try
                {
                    context.Response.OutputStream.Write(buff, 0, buff.Length);
                }
                catch (Exception ex) { Console.WriteLine("e> SendLoginPage(): " + ex.Message); }
            }
            context.Response.OutputStream.Close();
        }

        public void SendFile(HttpListenerContext context, String path)
        {
            String fileName = AppDomain.CurrentDomain.BaseDirectory + path;
            FileInfo fi = new FileInfo(fileName);
            if (fi.Exists)
            {
                Encoding contentEncoding = GetContentEncoding(fi.Extension);
                String contentType = GetContentType(fi.Extension);

                Byte[] buff = null;
                using (FileStream fs = fi.OpenRead())
                {
                    if (contentEncoding == Encoding.UTF8)
                    {
                        StreamReader sr = new StreamReader(fs, Encoding.UTF8);
                        buff = Encoding.UTF8.GetBytes(sr.ReadToEnd());
                    }
                    else
                    {
                        buff = new Byte[fi.Length];
                        fs.Read(buff, 0, buff.Length);
                    }
                }

                context.Response.ContentEncoding = contentEncoding;
                context.Response.ContentLength64 = buff.Length;
                context.Response.ContentType = contentType;
                try
                {
                    context.Response.OutputStream.Write(buff, 0, buff.Length);
                }
                catch (Exception ex) { Console.WriteLine("e> SendFile(): " + ex.Message); }
            }
            context.Response.OutputStream.Close();
        }

        private static Encoding GetContentEncoding(String extension)
        {
            Encoding contentEncoding = null;
            switch (extension)
            {
                case ".htm":
                case ".html":
                    contentEncoding = Encoding.UTF8;
                    break;
                case ".css":
                    contentEncoding = Encoding.UTF8;
                    break;
                case ".js":
                    contentEncoding = Encoding.UTF8;
                    break;
                case ".jpg":
                    contentEncoding = null;
                    break;
                case ".jpeg":
                case ".png":
                case ".gif":
                    contentEncoding = null;
                    break;
                default:
                    if (extension.Length > 1)
                    {
                        contentEncoding = null;
                    }
                    break;
            }
            return contentEncoding;
        }

        private static String GetContentType(String extension)
        {
            String contentType = "application/unknown";
            switch (extension)
            {
                case ".htm":
                case ".html":
                    contentType = "text/html";
                    break;
                case ".css":
                    contentType = "text/css"; // "text/stylesheet"
                    break;
                case ".js":
                    contentType = "text/javascript";
                    break;
                case ".jpg":
                    contentType = "image/jpeg";
                    break;
                case ".jpeg":
                case ".png":
                case ".gif":
                    contentType = "image/" + extension.Substring(1);
                    break;
                default:
                    if (extension.Length > 1)
                    {
                        contentType = "application/" + extension.Substring(1);
                    }
                    break;
            }
            return contentType;
        }

    }

}
