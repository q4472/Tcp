using System;
using System.Data;
using System.Data.SqlClient;

namespace Nskd.Data
{
    public static class Db
    {
        private static String sCnString = String.Format("Data Source={0};Initial Catalog=phs_s;Integrated Security=True", Proxy.App.MainSqlServerDataSource);

        public static class Log
        {
            public static void Write(
                String type,
                String remoteEndPointAddress,
                String httpMethod,
                String urlHost,
                Int32 urlPort,
                String urlAbsolutePath,
                String urlQuery
            )
            {
                SqlCommand cmd = new SqlCommand();
                cmd.Connection = new SqlConnection(sCnString);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.CommandText = "dbo.proxy_log_insert";
                cmd.Parameters.AddWithValue("@type", type);
                cmd.Parameters.AddWithValue("@remote_end_point_address", remoteEndPointAddress);
                cmd.Parameters.AddWithValue("@http_method", httpMethod);
                cmd.Parameters.AddWithValue("@url_host", urlHost);
                cmd.Parameters.AddWithValue("@url_port", urlPort);
                cmd.Parameters.AddWithValue("@url_absolute_path", urlAbsolutePath);
                cmd.Parameters.AddWithValue("@url_query", urlQuery);
                try
                {
                    cmd.Connection.Open();
                    cmd.ExecuteNonQuery();
                }
                catch (Exception e) { Console.WriteLine(e.ToString()); }
                finally { cmd.Connection.Close(); }
            }
        }

        public static class Session
        {
            public static void Create(String id, String userHostAddress,
                string rsaP, string rsaQ, string rsaModule, string rsaExponent, string rsaD
                )
            {
                SqlConnection cn = new SqlConnection(sCnString);
                SqlCommand cmd1 = new SqlCommand();
                cmd1.Connection = cn;
                cmd1.CommandType = CommandType.StoredProcedure;
                cmd1.CommandText = "dbo.session_insert";
                cmd1.Parameters.AddWithValue("@id", id);
                cmd1.Parameters.AddWithValue("@user_host_address", userHostAddress);
                SqlCommand cmd2 = new SqlCommand();
                cmd2.Connection = cn;
                cmd2.CommandType = CommandType.StoredProcedure;
                cmd2.CommandText = "dbo.rsaps_insert";
                cmd2.Parameters.AddWithValue("@id", id);
                cmd2.Parameters.AddWithValue("@p", rsaP);
                cmd2.Parameters.AddWithValue("@q", rsaQ);
                cmd2.Parameters.AddWithValue("@module", rsaModule);
                cmd2.Parameters.AddWithValue("@exponent", rsaExponent);
                cmd2.Parameters.AddWithValue("@d", rsaD);
                try
                {
                    cn.Open();
                    cmd1.ExecuteNonQuery();
                    cmd2.ExecuteNonQuery();
                }
                catch (Exception ex) { Console.WriteLine(ex.ToString()); }
                finally { cn.Close(); }
                return;
            }

            /*
            public static void UpdateCryptKey(
                String sessionId,
                String cryptKey
                )
            {
                SqlCommand cmd = new SqlCommand();
                cmd.Connection = new SqlConnection(sCnString);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.CommandText = "session_update_crypt_key";
                cmd.Parameters.AddWithValue("@session_id", sessionId);
                cmd.Parameters.AddWithValue("@crypt_key", cryptKey);
                try
                {
                    cmd.Connection.Open();
                    cmd.ExecuteNonQuery();
                }
                catch (Exception ex) { Console.WriteLine("e> " + ex.Message); }
                finally { cmd.Connection.Close(); }
            }
            */

            public static DataTable Update(
                String userToken,
                String sessionId,
                String cryptKey
                )
            {
                DataTable dt = new DataTable();
                SqlCommand cmd = new SqlCommand();
                cmd.Connection = new SqlConnection(sCnString);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.CommandText = "session_update";
                cmd.Parameters.AddWithValue("@user_token", userToken);
                cmd.Parameters.AddWithValue("@session_id", sessionId);
                cmd.Parameters.AddWithValue("@crypt_key", cryptKey);
                using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                {
                    da.Fill(dt);
                }
                return dt;
            }

            public static DataSet Get(string sessionId)
            {
                DataSet ds = new DataSet();
                SqlCommand cmd = new SqlCommand();
                cmd.Connection = new SqlConnection(sCnString);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.CommandText = "dbo.session_get";
                cmd.Parameters.AddWithValue("@id", sessionId);
                using (SqlDataAdapter da = new SqlDataAdapter(cmd))
                {
                    da.Fill(ds);
                }
                return ds;
            }
        }

        public static DataTable GetUserData(string token)
        {
            DataTable dt = new DataTable();
            SqlCommand cmd = new SqlCommand();
            cmd.Connection = new SqlConnection(sCnString);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.CommandText = "user_get";
            cmd.Parameters.AddWithValue("@token", token);
            using (SqlDataAdapter da = new SqlDataAdapter(cmd))
            {
                da.Fill(dt);
            }
            return dt;
        }

    }
}
