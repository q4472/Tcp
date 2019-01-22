using Nskd.Crypt;
using Nskd.Data;
using Nskd.HttpLib;
using System;
using System.Collections;
using System.Data;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

namespace Nskd.Proxy
{
    static class App
    {
        private static HttpServer server;

        private static IPAddress HostIPv4
        {
            get
            {
                IPAddress ip = null;
                IPAddress[] ips = Dns.GetHostEntry(Dns.GetHostName()).AddressList;
                for (int i = 0; i < ips.Length; i++)
                {
                    if (ips[i].AddressFamily == AddressFamily.InterNetwork)
                    {
                        ip = ips[i];
                        break;
                    }
                }
                return ip;
            }
        }
        public static String MainSqlServerDataSource = "127.0.0.1";
        public static Int32 Port = 80;

        private static class AddressTranslations
        {
            // таблицы переадресации и клиентов
            //      destination, sourse, IsProtected, HasSession, HasCrypt

            public static SiteInf[] siteInfs = new SiteInf[] {
                //new SiteInf("127.0.0.1", 11101, "srv-sap", true, false, false),
                new SiteInf("127.0.0.1", 11101, HostIPv4.ToString(), true, false, false),
                new SiteInf("127.0.0.1", 11101, "localhost", true, false, false),
                new SiteInf("127.0.0.1", 11101, "127.0.0.1", true, false, false),
                new SiteInf("127.0.0.1", 11101, "::1", true, false, false)
            };

            /*
            public static SiteInf[] siteInfsPrep = new SiteInf[] {
                //new SiteInf("127.0.0.1", 11201, "srv-sap", true, false, false),
                new SiteInf("127.0.0.1", 11201, HostIPv4.ToString(), true, false, false),
                new SiteInf("127.0.0.1", 11201, "localhost", true, false, false),
                new SiteInf("127.0.0.1", 11201, "127.0.0.1", true, false, false),
                new SiteInf("127.0.0.1", 11201, "::1", true, false, false)
            };
            */

            public static SiteInf[] siteInfsAgrs = new SiteInf[] {
                //new SiteInf("127.0.0.1", 11202, "srv-sap", true, false, false),
                new SiteInf("127.0.0.1", 11202, HostIPv4.ToString(), true, false, false),
                new SiteInf("127.0.0.1", 11202, "localhost", true, false, false),
                new SiteInf("127.0.0.1", 11202, "127.0.0.1", true, false, false),
                new SiteInf("127.0.0.1", 11202, "::1", true, false, false)
            };

            /*
            public static SiteInf[] siteInfsItems = new SiteInf[] {
                //new SiteInf("127.0.0.1", 11203, "srv-sap", true, false, false),
                new SiteInf("127.0.0.1", 11203, HostIPv4.ToString(), true, false, false),
                new SiteInf("127.0.0.1", 11203, "localhost", true, false, false),
                new SiteInf("127.0.0.1", 11203, "127.0.0.1", true, false, false),
                new SiteInf("127.0.0.1", 11203, "::1", true, false, false)
            };
            */

            public static SiteInf[] siteInfsImEx = new SiteInf[] {
                //new SiteInf("127.0.0.1", 11204, "srv-sap", true, false, false),
                new SiteInf("127.0.0.1", 11204, HostIPv4.ToString(), true, false, false),
                new SiteInf("127.0.0.1", 11204, "localhost", true, false, false),
                new SiteInf("127.0.0.1", 11204, "127.0.0.1", true, false, false),
                new SiteInf("127.0.0.1", 11204, "::1", true, false, false)
            };

            public static SiteInf[] siteInfsAgrs1 = new SiteInf[] {
                //new SiteInf("127.0.0.1", 11205, "srv-sap", true, false, false),
                new SiteInf("127.0.0.1", 11205, HostIPv4.ToString(), true, false, false),
                new SiteInf("127.0.0.1", 11205, "localhost", true, false, false),
                new SiteInf("127.0.0.1", 11205, "127.0.0.1", true, false, false),
                new SiteInf("127.0.0.1", 11205, "::1", true, false, false)
            };

        }

        private static Regex[] truePathesForGet = new Regex[] {
            new Regex("(?i)^/$"),
            new Regex("(?i)^/Login(/.*)?$"),
            new Regex("(?i)^/Scripts(/.*)?$"),
            new Regex("(?i)^/Content(/.*)?$"),
            new Regex("(?i)^/Areas/Deposits/Views/F0/Письмо.html$"),
            new Regex("(?i)^/Areas/Reports/Content/Reports.css$"),
            new Regex("(?i)^/bundles/jquery$"),
            new Regex("(?i)^/bundles/jqueryval$"),
            new Regex("(?i)^/bundles/jqueryfu$"),
            new Regex("(?i)^/bundles/nskd$"),
            new Regex("(?i)^/bundles/modernizr$"),
            new Regex("(?i)^/Views/Shared/Imgs(/.*)?$"),
            new Regex("(?i)^/Views/Shared/Menu/Nskd.Menu.leaf.png$"),
            new Regex("(?i)^/Views/Shared/Menu/Nskd.Menu.plus.png$"),
            new Regex("(?i)^/favicon.ico$"),
            new Regex("(?i)^/test(/.*)?$")
        };

        private static Regex[] truePathesForPost = new Regex[] {
            new Regex("(?i)^/$"),
            new Regex("(?i)^/Home(/.*)?$"),
            new Regex("(?i)^/Fs(/.*)?$"),
            new Regex("(?i)^/Dgv(/.*)?$"),
            // Areas
            new Regex("(?i)^/Agrs(/.*)?$"),
            new Regex("(?i)^/ImEx(/.*)?$"),
            new Regex("(?i)^/Env(/.*)?$"),
            new Regex("(?i)^/ExternalPages(/.*)?$"),
            new Regex("(?i)^/Deposits(/.*)?$"),
            new Regex("(?i)^/Docs(/.*)?$"),
            new Regex("(?i)^/Docs1c(/.*)?$"),
            new Regex("(?i)^/Items(/.*)?$"),
            new Regex("(?i)^/Order(/.*)?$"),
            new Regex("(?i)^/Prep(/.*)?$"),
            new Regex("(?i)^/Reports(/.*)?$"),
            new Regex("(?i)^/Tn(/.*)?$"),
            new Regex("(?i)^/DeliverySchedule(/.*)?$"),
            new Regex("(?i)^/Settings(/.*)?$"),
            new Regex("(?i)^/AdminPages(/.*)?$"),
            new Regex("(?i)^/Mess(/.*)?$"),
            new Regex("(?i)^/Supply(/.*)?$"),
            new Regex("(?i)^/test(/.*)?$")
        };

        public static void Main(string[] args)
        {
            if (args != null)
            {
                foreach (String arg in args)
                {
                    if (arg == "-d14" || arg == "/d14") { MainSqlServerDataSource = "192.168.135.14"; }
                    if (arg == "-d77" || arg == "/d77") { MainSqlServerDataSource = "192.168.135.77"; }
                    if (arg == "-p80" || arg == "/p80") { Port = 80; }
                    if (arg == "-p81" || arg == "/p81") { Port = 81; }
                    if (arg == "-p8080" || arg == "/p8080") { Port = 8080; }
                    if (arg == "-p8181" || arg == "/p8181") { Port = 8181; }
                }
            }
            if (Port == 81 || Port == 8181)
            {
                AddressTranslations.siteInfs = new SiteInf[]
                {
                    new SiteInf("127.0.0.1", 11102, HostIPv4.ToString(), true, false, false),
                    new SiteInf("127.0.0.1", 11102, "localhost", true, false, false),
                    new SiteInf("127.0.0.1", 11102, "127.0.0.1", true, false, false),
                    new SiteInf("127.0.0.1", 11102, "::1", true, false, false)
                };
            }
            while (true)
            {
                try
                {
                    server = new HttpServer();
                    server.OnIncomingRequest += new HttpServer.RequestDelegate(OnIncomingRequest);
                    server.Start(String.Format("http://+:{0}/", Port));
                }
                catch (Exception e) { Console.WriteLine(e); }
            }
        }

        private static void OnIncomingRequest(HttpListenerContext context)
        {
            HttpListenerRequest incomingRequest = context.Request;
            String address = incomingRequest.RemoteEndPoint.Address.ToString();
            String method = incomingRequest.HttpMethod;
            String host = incomingRequest.Url.Host;
            Int32 port = incomingRequest.Url.Port;
            String path = incomingRequest.Url.AbsolutePath;
            String query = incomingRequest.Url.Query;

            // Пишем информацию о запросе в журнал.
            Db.Log.Write("IncomingRequest", address, method, host, port, path, query);

            // подбираем набор сайтов для переадресации
            SiteInf[] csinf = AddressTranslations.siteInfs;

            // подбираем набор сайтов для переадресации
            if (port == 80 || port == 8080)
            {
                /*
                if ((new Regex("(?i)^/Prep(/.*)?$")).IsMatch(path))
                {
                    //Console.WriteLine(method + ", " + path);
                    //csinf = siteInfsPrep;
                }
                */
                if ((new Regex("(?i)^/Agrs(/.*)?$")).IsMatch(path))
                {
                    //Console.WriteLine(method + ", " + path);
                    csinf = AddressTranslations.siteInfsAgrs;
                }
                /*
                if ((new Regex("(?i)^/Items(/.*)?$")).IsMatch(path) ||
                    (new Regex("(?i)^/Tn(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = AddressTranslations.siteInfsItems;
                }
                */
                if ((new Regex("(?i)^/ImEx(/.*)?$")).IsMatch(path))
                {
                    //Console.WriteLine(method + ", " + path);
                    csinf = AddressTranslations.siteInfsImEx;
                }
                if ((new Regex("(?i)^/Agrs/F1(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = AddressTranslations.siteInfsAgrs1;
                }
                if((new Regex("(?i)^/DeliverySchedule/F3(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = new SiteInf[] {
                        new SiteInf("127.0.0.1", 11207, HostIPv4.ToString(), true, false, false),
                        new SiteInf("127.0.0.1", 11207, "localhost", true, false, false),
                        new SiteInf("127.0.0.1", 11207, "127.0.0.1", true, false, false),
                        new SiteInf("127.0.0.1", 11207, "::1", true, false, false)
                    };
                }
                if ((new Regex("(?i)^/Settings/F0(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = new SiteInf[] {
                        new SiteInf("127.0.0.1", 11208, HostIPv4.ToString(), true, false, false),
                        new SiteInf("127.0.0.1", 11208, "localhost", true, false, false),
                        new SiteInf("127.0.0.1", 11208, "127.0.0.1", true, false, false),
                        new SiteInf("127.0.0.1", 11208, "::1", true, false, false)
                    };
                }
                if ((new Regex("(?i)^/AdminPages/F0(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = new SiteInf[] {
                        new SiteInf("127.0.0.1", 11209, HostIPv4.ToString(), true, false, false),
                        new SiteInf("127.0.0.1", 11209, "localhost", true, false, false),
                        new SiteInf("127.0.0.1", 11209, "127.0.0.1", true, false, false),
                        new SiteInf("127.0.0.1", 11209, "::1", true, false, false)
                    };
                }
                if ((new Regex("(?i)^/Mess/F0(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = new SiteInf[] {
                        new SiteInf("127.0.0.1", 11210, HostIPv4.ToString(), true, false, false),
                        new SiteInf("127.0.0.1", 11210, "localhost", true, false, false),
                        new SiteInf("127.0.0.1", 11210, "127.0.0.1", true, false, false),
                        new SiteInf("127.0.0.1", 11210, "::1", true, false, false)
                    };
                }
                if ((new Regex("(?i)^/Supply/F0(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = new SiteInf[] {
                        new SiteInf("127.0.0.1", 11211, HostIPv4.ToString(), true, false, false),
                        new SiteInf("127.0.0.1", 11211, "localhost", true, false, false),
                        new SiteInf("127.0.0.1", 11211, "127.0.0.1", true, false, false),
                        new SiteInf("127.0.0.1", 11211, "::1", true, false, false)
                    };
                }
            }
            if (port == 81 || port == 8181)
            {
                if ((new Regex("(?i)^/Agrs/F1(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = AddressTranslations.siteInfsAgrs1;
                }
                if ((new Regex("(?i)^/Reports(/.*)?$")).IsMatch(path))
                {
                    Console.WriteLine(method + ", " + path);
                    csinf = new SiteInf[] {
                        new SiteInf("127.0.0.1", 11206, HostIPv4.ToString(), true, false, false),
                        new SiteInf("127.0.0.1", 11206, "localhost", true, false, false),
                        new SiteInf("127.0.0.1", 11206, "127.0.0.1", true, false, false),
                        new SiteInf("127.0.0.1", 11206, "::1", true, false, false)
                    };
                }
            }



            try
            {
                // Проверяем address, method, host, path.
                if (AddressIsAcceptable(address) &&
                    MethodIsAcceptable(method) &&
                    HostIsAcceptable(host, csinf) &&
                    PathIsAcceptable(method, path))
                {
                    // Всё в порядке - на обработку.
                    //Console.WriteLine("d> На обработку.");
                    HttpWebResponse incomingResponse = null;
                    try
                    {
                        incomingResponse = RedirectIncomingRequest(context, csinf);
                    }
                    catch (Exception)
                    {
                        server.SendErrorPage(context, HttpStatusCode.InternalServerError);
                    }
                    // Ответа от клиента может и не быть если запрос перехвачен и ответ пользователю
                    // уже отправлен внутри RedirectIncomingRequest().
                    if (incomingResponse != null)
                    {
                        try
                        {
                            //Console.WriteLine("OnIncomingRequest: Получен ответ");
                            // То что получили от клиента пресылаем пользователю
                            SendResponse(context, incomingResponse);
                            // Освобождаем ресурсы.
                            incomingResponse.Close();
                        }
                        catch (Exception e) { Db.Log.Write("OnIncomingRequest level 2:" + e.ToString(), address, method, host, port, path, query); }
                    }
                    //else { Console.WriteLine("OnIncomingRequest: Ответа нет"); }
                }
                else
                {
                    // Всё остальное оставляем без ответа.
                    //Console.WriteLine("d> Без ответа.");
                }

                // Закрываем соединение с пользователем и освобождаем ресурсы.
                context.Response.Close();
            }
            catch (Exception e) { Db.Log.Write("OnIncomingRequest level 1:" + e.ToString(), address, method, host, port, path, query); }
        }

        private static Boolean AddressIsAcceptable(String remoteEndPointAddress)
        {
            Boolean result = true;
            if ((remoteEndPointAddress.Length >= 7) && (remoteEndPointAddress.Substring(0, 7) == "66.249."))
            {
                result = false;
            }
            if (result == false)
            {
                Console.WriteLine("d> Remote end point address '" + remoteEndPointAddress + "' is forbidden.");
            }
            return result;
        }
        private static Boolean MethodIsAcceptable(String httpMethod)
        {
            Boolean result = false;
            switch (httpMethod)
            {
                case "GET":
                case "HEAD":
                case "POST":
                    result = true;
                    break;
                default:
                    break;
            }
            if (result == false)
            {
                Console.WriteLine("d> Http method '" + httpMethod + "' is not acceptable.");
            }
            return result;
        }
        private static Boolean HostIsAcceptable(String host, SiteInf[] csinf)
        {
            Boolean result = false;
            foreach (SiteInf siteInf in csinf)
            {
                if (siteInf.UserHost == host)
                {
                    result = true;
                    break;
                }
            }
            if (result == false)
            {
                Console.WriteLine("d> Host '" + host + "' is not acceptable.");
            }
            return result;
        }
        private static Boolean PathIsAcceptable(String httpMethod, String path)
        {
            Boolean result = false;
            // Приводим к изначальному виду, преобразуя экранированные символы.
            // Например, "%20" -> " ".
            path = Uri.UnescapeDataString(path);
            // Если в строке нет двоеточия, то годится.
            // Это нужно для защиты от path типа "/../../file.txt"
            if (path.IndexOf("..") < 0)
            {
                result = true;
            }
            switch (httpMethod)
            {
                case "GET":
                    foreach (Regex re in truePathesForGet)
                    {
                        if (result = re.IsMatch(path)) break;
                    }
                    break;
                case "POST":
                    foreach (Regex re in truePathesForPost)
                    {
                        if (result = re.IsMatch(path)) break;
                    }
                    break;
                default:
                    break;
            }
            if (result == false)
            {
                Console.WriteLine("d> For http method '" + httpMethod + "' path '" + path + "' is not acceptable.");
            }
            return result;
        }

        private static void SendResponse(HttpListenerContext context, HttpWebResponse incomingResponse)
        {
            // Лишняя проверка - после отладки можно убрать.
            if (incomingResponse != null)
            {
                // Если ответ от клиента правильный, то пересылаем его пользователю.
                if (incomingResponse.StatusCode == HttpStatusCode.OK)
                {
                    server.SendResponse(context, incomingResponse);
                }
                // Если ответ от клиента не правильный, то отправляем пользователю
                // страницу с сообщением об ошибке.
                else
                {
                    server.SendErrorPage(context, incomingResponse.StatusCode);
                }
            }
        }

        private static HttpWebResponse RedirectIncomingRequest(HttpListenerContext context, SiteInf[] csinf)
        {
            // Выбираем к какому сайту (клиенту) запрос.
            // Один точно найдётся. Проверено.
            // Передаём ему запрос и получаем ответ.
            //Console.WriteLine("d> RedirectIncomingRequest");
            HttpListenerRequest incomingRequest = context.Request;
            HttpWebResponse incomingResponse = null;

            foreach (SiteInf siteInf in csinf)
            {
                //Console.WriteLine("d> RedirectIncomingRequest: " + incomingRequest.Url.ToString());
                if (siteInf.UserHost == incomingRequest.Url.Host)
                {
                    //Console.WriteLine("d> RedirectIncomingRequest: Нашли целевой хост.");
                    if (siteInf.IsProtected) // если надо отслеживать сесию - допобработка 
                    {
                        incomingResponse = ProcessIncomingRequestToProtectedSite(context, siteInf);
                    }
                    else // те которые без сессии - проходят без обработки
                    {
                        //Console.WriteLine("d> RedirectIncomingRequest: " + siteInf.Client.ToString());
                        try
                        {
                            incomingResponse = siteInf.Client.GetResponse(context);
                        }
                        catch (Exception e)
                        {
                            Console.WriteLine("d> RedirectIncomingRequest: " + e.ToString());
                        }
                    }
                    break;
                }
            }
            return incomingResponse;
        }

        private static HttpWebResponse ProcessIncomingRequestToProtectedSite(HttpListenerContext context, SiteInf siteInf)
        {
            HttpListenerRequest incomingRequest = context.Request;
            HttpWebResponse incomingResponse = null;

            // GET - create session, or POST - download session
            if (incomingRequest.HttpMethod == "GET") // ! разобраться с HEAD
            {
                // Запросы типа GET могут быть к защищённому сайту (за ccs или js)
                // или могут быть к странице Login. Те которые к Login перехватываем
                // и отправляем ответ прямо из файлов которые есть на прокси. Кроме того, если
                // запрос без адреса или к странице Login, то создаём и регистрируем новую сессию.
                String userAddress = null;
                NskdSession session = null;
                switch (incomingRequest.Url.AbsolutePath)
                {
                    case "/":
                    case "/login/login.html":
                        userAddress = context.Request.RemoteEndPoint.Address.ToString();
                        session = new NskdSession(userAddress);
                        RsaParameters ps = session.Rsa.ExportParameters();
                        String sessionId = session.SessionId;
                        String rsaModule = Convert.ToBase64String(ps.Module);
                        String rsaExponent = Convert.ToBase64String(ps.Exponent);
                        server.SendLoginPage(context, sessionId, rsaModule, rsaExponent);
                        break;
                    case "/login/login.css":
                        server.SendFile(context, @"Login\Login.css");
                        break;
                    case "/login/login.js":
                        server.SendFile(context, @"Login\Login.js");
                        break;
                    case "/scripts/cryptico/cryptico.min.js":
                        server.SendFile(context, @"Scripts\Cryptico\cryptico.min.js");
                        break;
                    case "/scripts/nskd/nskd.js":
                        server.SendFile(context, @"Scripts\Nskd\Nskd.js");
                        break;
                    default:
                        // если запрос типа GET не перехвачен, то перенаправляем его клиенту
                        incomingResponse = siteInf.Client.GetResponse(context);
                        break;
                }
            }
            else if (incomingRequest.HttpMethod == "POST")
            {
                incomingResponse = ProcessPost(incomingRequest, context, siteInf);
            }
            else  // все остальные кроме GET и POST. ! разобраться с HEAD
            {
                incomingResponse = siteInf.Client.GetResponse(context);
            }
            return incomingResponse;
        }

        private static HttpWebResponse ProcessPost(HttpListenerRequest incomingRequest, HttpListenerContext context, SiteInf siteInf)
        {
            HttpWebResponse incomingResponse = null;
            String response = null;
            // Если запросы типа POST, то все их перенаправляем клиенту.
            // Здесь надо поймать первый запрос с общим ключём для шифрования.
            switch (incomingRequest.Url.AbsolutePath)
            {
                case "/": // это запрос от страницы Login - надо потом добавить проверку

                    // сессия уже есть, в потоке зашифрованный запрос
                    NskdSession session = null;
                    String data = null;
                    MemoryStream ms1 = new MemoryStream();
                    MemoryStream ms2 = new MemoryStream();
                    incomingRequest.InputStream.CopyTo(ms1);
                    ms1.Position = 0;
                    ms1.CopyTo(ms2);
                    ms1.Position = 0;
                    ms2.Position = 0;
                    using (var sr = new StreamReader(ms1, Encoding.UTF8))
                    {
                        data = sr.ReadToEnd();
                    }
                    if (!String.IsNullOrWhiteSpace(data)) // поток не пустой - расшифровка
                    {
                        //Console.WriteLine("ProcessPost(): поток не пустой - расшифровка");
                        // возможно два варианта:
                        // 1. Это первый запрос после GET.
                        //    В нем есть <sessionId + \r\n + зашифрованный_rsa_common_key + \r\n + data>
                        // 2. Это не первый запрос после GET.
                        //    В нем <sessionId + \r\n + data>
                        // Отличить можно по наличю общего ключа.
                        Int32 sessionIdLength = data.IndexOf("\r\n");
                        if (sessionIdLength > 0)
                        {
                            Int32 readerPointer = 0;
                            String sessionId = data.Substring(readerPointer, sessionIdLength);
                            readerPointer += sessionIdLength;
                            readerPointer += 2; // 0d 0a
                            session = NskdSession.GetById(sessionId);
                            //Console.WriteLine("ProcessPost(): session.SessionId " + session.SessionId);
                            // проверяем общий ключ
                            if (session.CryptKey == null)
                            {
                                // Общего ключа ещё нет. Значит он должен быть в запросе, зашифрованный RSA.
                                readerPointer += LoadCryptKeyFromRequestDataToSession(data, readerPointer, session);
                                readerPointer += 2; // \r\n
                            }
                            if (session.CryptKey != null) // или загрузился из базы или только что создан из запроса
                            {
                                data = data.Substring(readerPointer);
                                response = CryptRequestParser(data, session);
                                if (response.Length > 0)
                                {
                                    ms2 = new MemoryStream();
                                    //Byte[] buff = Encoding.UTF8.GetBytes(response);
                                    //ms2.Write(buff, 0, buff.Length);
                                }
                            }
                        }
                    }
                    incomingResponse = siteInf.Client.GetResponse(context, session.SessionId, ms2);
                    break;
                default:
                    incomingResponse = siteInf.Client.GetResponse(context);
                    break;
            }
            return incomingResponse;
        }

        private static Int32 LoadCryptKeyFromRequestDataToSession(String data, Int32 readerPointer, NskdSession session)
        {
            int b64EncryptedKeyMessageLength = data.IndexOf("\r\n", readerPointer) - readerPointer;
            if (b64EncryptedKeyMessageLength > 0)
            {
                // есть только первый раз
                String b64EncryptedKeyMessage = data.Substring(readerPointer, b64EncryptedKeyMessageLength);
                Byte[] encryptedKeyMessage = Convert.FromBase64String(b64EncryptedKeyMessage);
                session.CryptKey = session.Rsa.DecryptMessage(encryptedKeyMessage, true);
            }
            return b64EncryptedKeyMessageLength;
        }

        private static String CryptRequestParser(String data, NskdSession session)
        {
            String response = null;

            // дешифрование запроса
            Byte[] encryptedBytes = Convert.FromBase64String(data);
            Byte[] plainBytes = session.Decrypt(encryptedBytes);
            String package = Encoding.UTF8.GetString(plainBytes);

            // разбор запроса
            try
            {
                // пока не разбор запроса, а только выполнение входа и регистрация пользователя
                RequestPackage p = new RequestPackage(package);
                String userToken = (string)p.GetParameterValueByName("userId");
                session.Update(userToken);
            }
            catch (Exception ex) { Console.WriteLine(ex.Message); }

            if (response != null)
            {
                // шифрование ответа
                plainBytes = Encoding.UTF8.GetBytes(response);
                encryptedBytes = session.Encrypt(plainBytes);
                data = Convert.ToBase64String(encryptedBytes);
            }
            return package;
        }
    }

    class SiteInf
    {
        public String SiteHost;
        public UInt32 SitePort;
        public String UserHost;
        public Boolean IsProtected;
        public Boolean HasSession;
        public Boolean HasCrypt;

        public HttpClient Client;
        public SiteInf() { }
        public SiteInf(
            String siteHost,
            UInt32 sitePort,
            String userHost,
            Boolean isProtected,
            Boolean hasSession,
            Boolean hasCrypt
            )
        {
            SiteHost = siteHost;
            SitePort = sitePort;
            UserHost = userHost;
            IsProtected = isProtected;
            HasSession = hasSession;
            HasCrypt = hasCrypt;
            Client = new HttpClient(SiteHost, SitePort);
        }
    }

    // содержит все данные пришедшие с запросом
    class RequestPackage
    {
        private class RequestParameter
        {
            public String Name;
            public Object Value;
        }
        private RequestParameter[] Parameters;
        private RequestParameter GetParameterByName(string name)
        {
            RequestParameter parameter = null;
            if (!String.IsNullOrEmpty(name))
            {
                foreach (RequestParameter p in Parameters)
                {
                    if (p.Name == name)
                    {
                        parameter = p;
                        break;
                    }
                }
            }
            return parameter;
        }

        //
        //public HttpRequestBase Request;
        //public HttpServerUtilityBase Server;
        public String CommandType;
        public String Command;
        public String SelectedMenuNodePath;
        public RequestPackage() { }
        public RequestPackage(String pack)
        {
            //throw new Exception("Ank1.Models.RequestPackage.RequestPackage(): " + pack);

            //Request = controllerContext.HttpContext.Request;
            //Server = controllerContext.RequestContext.HttpContext.Server;

            if (pack[0] == '{') // формат json
            {
                Object data = null;
                try
                {
                    data = Nskd.Json.Json.Parse(pack);
                }
                catch (Exception ex)
                {
                    throw new Exception("Ank1.Models.RequestPackage.RequestPackage(): " + ex.Message + "\npack: " + pack);
                }
                //throw new Exception("Ank1.Models.RequestPackage.RequestPackage(): " + data.GetType().ToString());
                if (data.GetType().ToString() == "System.Collections.Hashtable")
                {
                    Hashtable ht = (Hashtable)data;
                    if (ht.ContainsKey("cmdType")) CommandType = ht["cmdType"] as String;
                    //throw new Exception("Ank1.Models.RequestPackage.RequestPackage(): " + CommandType);
                    if (ht.ContainsKey("cmd")) Command = ht["cmd"] as String;
                    if (ht.ContainsKey("selectedMenuNodePath")) SelectedMenuNodePath = ht["selectedMenuNodePath"] as String;

                    //throw new Exception(SelectedMenuNodePath);

                    if (String.IsNullOrEmpty(SelectedMenuNodePath))
                    {
                        if (ht.ContainsKey("envVars"))
                        {
                            Hashtable envVars = ht["envVars"] as Hashtable;
                            SelectedMenuNodePath = envVars["selectedMenuNodePath"] as String;
                        }
                    }
                    if (!String.IsNullOrEmpty(SelectedMenuNodePath))
                    {
                        SelectedMenuNodePath = (new Regex(@"^\[Пользователь: [^\]]*\]\.")).Replace(SelectedMenuNodePath, "");
                    }
                    ArrayList ps = new ArrayList();
                    foreach (DictionaryEntry de in ht)
                    {
                        RequestParameter par = new RequestParameter();
                        par.Name = de.Key as String;
                        par.Value = de.Value;
                        ps.Add(par);
                    }
                    Parameters = (RequestParameter[])ps.ToArray(typeof(RequestParameter));
                }
            }
            //throw new Exception("Ank1.Models.RequestPackage.RequestPackage(): " + "The end.");
        }
        public Object GetParameterValueByName(String name)
        {
            Object value = null;
            RequestParameter p = GetParameterByName(name);
            if (p != null) value = p.Value;
            return value;
        }
    }

    public class NskdSession
    {
        public String SessionId;
        public CryptServiceProvider Csp;
        public Int32 UserId;
        public Byte[] CryptKey { get { return Csp.AesKey; } set { Csp.AesKey = value; } }
        public Rsa Rsa;
        public String UserHostAddress;

        public NskdSession() { }

        public NskdSession(String userHostAddress)
        {
            SessionId = Guid.NewGuid().ToString();
            UserId = 0;
            UserHostAddress = userHostAddress;
            Rsa = new Rsa(48);
            Csp = new CryptServiceProvider();
            var rsaPs = Rsa.ExportParameters();
            // регистрируем новую сессию пока без ключа и без пользователя
            Db.Session.Create(
                SessionId,
                UserHostAddress,
                Convert.ToBase64String(rsaPs.P),
                Convert.ToBase64String(rsaPs.Q),
                Convert.ToBase64String(rsaPs.Module),
                Convert.ToBase64String(rsaPs.Exponent),
                Convert.ToBase64String(rsaPs.D));
        }

        public static NskdSession GetById(String sessionId)
        {
            NskdSession session = new NskdSession();
            session.SessionId = sessionId;
            // загружаем данные сессии
            DataSet sessionDataSet = Data.Db.Session.Get(sessionId);
            //Console.WriteLine(sessionDataSet.Tables.Count.ToString());
            session.Csp = new CryptServiceProvider();
            if (sessionDataSet.Tables.Count > 0)
            {
                DataTable dt0 = sessionDataSet.Tables[0];
                if (dt0.Rows.Count > 0)
                {
                    DataRow dr = dt0.Rows[0];
                    session.UserId = (dr["user_id"] != DBNull.Value) ? (Int32)dr["user_id"] : 0;
                    if (dr["crypt_key"] != DBNull.Value)
                    {
                        session.CryptKey = Convert.FromBase64String((String)dr["crypt_key"]);
                    }
                    else // Это первый запрос с зашифрованным ключом. Надо восстановить параметры RSA.
                    {
                        if (sessionDataSet.Tables.Count > 1)
                        {
                            DataTable dt1 = sessionDataSet.Tables[1];
                            if (dt1.Rows.Count > 0)
                            {
                                dr = dt1.Rows[0];
                                RsaParameters ps = new RsaParameters();
                                ps.P = Convert.FromBase64String(dr["p"] as String);
                                ps.Q = Convert.FromBase64String(dr["q"] as String);
                                ps.Module = Convert.FromBase64String(dr["module"] as String);
                                ps.Exponent = Convert.FromBase64String(dr["exponent"] as String);
                                ps.D = Convert.FromBase64String(dr["d"] as String);
                                session.Rsa = new Rsa();
                                session.Rsa.ImportParameters(ps);
                            }
                        }
                    }
                }
            }
            return session;
        }

        public void Update(String userToken)
        {
            DataTable dt = Db.Session.Update(userToken, SessionId, Convert.ToBase64String(CryptKey));
            if (dt.Rows.Count > 0)
            {
                DataRow dr = dt.Rows[0];
                UserId = (dr["user_id"] != DBNull.Value) ? (Int32)dr["user_id"] : 0;
            }
        }

        public Byte[] Decrypt(Byte[] encryptedBytes) { return Csp.Decrypt(encryptedBytes); }
        public Byte[] Encrypt(Byte[] plainBytes) { return Csp.Encrypt(plainBytes); }
    }
}
