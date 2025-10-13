import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";
export const authapiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: { ...credentials },
      }),
    }),
    sendLogout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(logOut());
          setTimeout(() => {
            dispatch(apiSlice.util.resetApiState());
          }, 1000);
        } catch (err) {}
      },
    }),
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "GET",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const { accessToken } = data;
          dispatch(setCredentials({ accessToken }));
        } catch (err) {}
      },
    }),
    AttendeeRegister: builder.mutation({
      query: (payload) => ({
        url: "/auth/register/attendee",
        method: "POST",
        body: payload,
      }),
    }),
    ExhibitorRegister: builder.mutation({
      query: (payload) => ({
        url: "/auth/register/exhibitor",
        method: "POST",
        body: payload,
      }),
    }),
    googleExchange: builder.mutation({
      query: (body) => ({
        url: "/auth/google/exchange",
        method: "POST",
        body, // { code }
      }),
    }),
    resendVerification: builder.query({
     query: (actorId) => ({
       url: `/auth/resend-verification/${actorId}`,
       method: 'POST'
     }),
   }),
   forgotPassword: builder.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),

    resetPassword: builder.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),

    setPassword: builder.mutation({
      query: (body) => ({ url: '/auth/set-password', method: 'POST', body }),
    }),

    changeEmail: builder.mutation({
      query: (body) => ({ url: '/auth/change-email', method: 'POST', body }),
    }),

    restoreEmail: builder.mutation({
      query: (body) => ({ url: '/auth/restore-email', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSendLogoutMutation,
  useRefreshMutation,
  useAttendeeRegisterMutation,
  useExhibitorRegisterMutation,
  useGoogleExchangeMutation,
  useResendVerificationQuery,
  useLazyResendVerificationQuery, 
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useSetPasswordMutation,
  useChangeEmailMutation,
  useRestoreEmailMutation,
} = authapiSlice;
