import { apiSlice } from "../../app/api/apiSlice";
import { logOut, setCredentials } from "./authSlice";

/**
 * Auth endpoints for the v2 platform user system.
 */
export const authapiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* 1) Email + password login */
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: { ...credentials },
        // IMPORTANT: treat ALL HTTP statuses as "data", not RTK error
        validateStatus: () => true,
      }),
      transformResponse: (response, meta) => {
        const httpStatus = meta?.response?.status;
        // Attach HTTP status so the frontend can distinguish success vs error
        return {
          ...response,
          _httpStatus: httpStatus,
        };
      },
    }),

    /* 2) Platform user registration */
    registerUser: builder.mutation({
      query: (body) => ({
        url: "/auth/user/register",
        method: "POST",
        body,
      }),
    }),

    /* 3) Logout (clear refresh cookie) */
    sendLogout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // ignore network / server errors on logout
        } finally {
          dispatch(logOut());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),

    /* 4) Refresh access token from cookie */
    refresh: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "GET",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.accessToken) {
            dispatch(
              setCredentials({
                accessToken: data.accessToken,
                ActorId: data.ActorId || null,
              })
            );
          }
        } catch {
          // PersistLogin will handle redirect / logout on failure
        }
      },
    }),

    /* 5) Event role registrations */
    attendeeRegister: builder.mutation({
      query: (body) => ({
        url: "/auth/register/attendee",
        method: "POST",
        body,
      }),
    }),

    exhibitorRegister: builder.mutation({
      query: (body) => ({
        url: "/auth/register/exhibitor",
        method: "POST",
        body,
      }),
    }),

    /* 6) Google login (ID token) */
    googleExchange: builder.mutation({
      query: (body) => ({
        url: "/auth/google-login",
        method: "POST",
        body,
      }),
    }),

    /* 7) Email verification helpers */
    resendVerification: builder.query({
      query: (actorId) => ({
        url: `/auth/resend-verification/${actorId}`,
        method: "POST",
      }),
    }),

    /* 8) Password / e-mail flows */
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    setPassword: builder.mutation({
      query: (body) => ({
        url: "/auth/set-password",
        method: "POST",
        body,
      }),
    }),

    changeEmail: builder.mutation({
      query: (body) => ({
        url: "/auth/change-email",
        method: "POST",
        body,
      }),
    }),

    restoreEmail: builder.mutation({
      query: (body) => ({
        url: "/auth/restore-email",
        method: "POST",
        body,
      }),
    }),
    resendVerificationForVisitor: builder.query({
      // arg can be: string (actorId) OR { actorId } OR { email }
      query: (arg) => {
        // string → assume actorId (old behavior)
        if (typeof arg === "string") {
          return {
            url: `/auth/resend-verification/${arg}`,
            method: "POST",
          };
        }

        // object with actorId
        if (arg && typeof arg === "object" && arg.actorId) {
          return {
            url: `/auth/resend-verification/${arg.actorId}`,
            method: "POST",
          };
        }

        // object with email → new user route
        if (arg && typeof arg === "object" && arg.email) {
          return {
            url: `/auth/user/resend-verification`,
            method: "POST",
            body: { email: arg.email },
          };
        }

        // fallback: empty body
        return {
          url: `/auth/user/resend-verification`,
          method: "POST",
          body: {},
        };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterUserMutation,
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
  useResendVerificationForVisitorQuery,
  useLazyResendVerificationForVisitorQuery,
} = authapiSlice;
