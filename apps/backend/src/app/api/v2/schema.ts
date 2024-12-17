/* eslint-disable no-restricted-syntax */
import {
  yupObject,
  yupArray,
  yupTuple,
  yupString,
  yupNumber,
  yupBoolean,
  yupMixed,
} from '@stackframe/stack-shared/dist/schema-fields';

const endpointSchema = {
  '/': {
    GET: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupString().defined(),
        },
      },
    },
  },
  '/users': {
    GET: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                primary_email: yupString().nullable(),
                primary_email_verified: yupBoolean().defined(),
                primary_email_auth_enabled: yupBoolean().defined(),
                display_name: yupString().nullable(),
                selected_team: yupObject({
                  created_at_millis: yupNumber().defined(),
                  server_metadata: yupMixed().optional().nullable(),
                  id: yupString().defined(),
                  display_name: yupString().defined(),
                  profile_image_url: yupString().nullable(),
                  client_metadata: yupMixed().optional().nullable(),
                  client_read_only_metadata: yupMixed().optional().nullable(),
                }).nullable(),
                selected_team_id: yupString().nullable(),
                profile_image_url: yupString().nullable(),
                signed_up_at_millis: yupNumber().defined(),
                has_password: yupBoolean().defined(),
                otp_auth_enabled: yupBoolean().defined(),
                passkey_auth_enabled: yupBoolean().defined(),
                client_metadata: yupMixed().nullable(),
                client_read_only_metadata: yupMixed().nullable(),
                server_metadata: yupMixed().nullable(),
                last_active_at_millis: yupNumber().defined(),
                oauth_providers: yupArray(
                  yupObject({
                    id: yupString().defined(),
                    account_id: yupString().defined(),
                    email: yupString().optional().nullable(),
                  }).defined(),
                ).defined(),
                auth_with_email: yupBoolean().defined(),
                requires_totp_mfa: yupBoolean().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                primary_email: yupString().nullable(),
                primary_email_verified: yupBoolean().defined(),
                primary_email_auth_enabled: yupBoolean().defined(),
                display_name: yupString().nullable(),
                selected_team: yupObject({
                  created_at_millis: yupNumber().defined(),
                  server_metadata: yupMixed().optional().nullable(),
                  id: yupString().defined(),
                  display_name: yupString().defined(),
                  profile_image_url: yupString().nullable(),
                  client_metadata: yupMixed().optional().nullable(),
                  client_read_only_metadata: yupMixed().optional().nullable(),
                }).nullable(),
                selected_team_id: yupString().nullable(),
                profile_image_url: yupString().nullable(),
                signed_up_at_millis: yupNumber().defined(),
                has_password: yupBoolean().defined(),
                otp_auth_enabled: yupBoolean().defined(),
                passkey_auth_enabled: yupBoolean().defined(),
                client_metadata: yupMixed().nullable(),
                client_read_only_metadata: yupMixed().nullable(),
                server_metadata: yupMixed().nullable(),
                last_active_at_millis: yupNumber().defined(),
                oauth_providers: yupArray(
                  yupObject({
                    id: yupString().defined(),
                    account_id: yupString().defined(),
                    email: yupString().optional().nullable(),
                  }).defined(),
                ).defined(),
                auth_with_email: yupBoolean().defined(),
                requires_totp_mfa: yupBoolean().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
  },
  '/teams': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                created_at_millis: yupNumber().defined(),
                server_metadata: yupMixed().optional().nullable(),
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                created_at_millis: yupNumber().defined(),
                server_metadata: yupMixed().optional().nullable(),
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            created_at_millis: yupNumber().defined(),
            server_metadata: yupMixed().optional().nullable(),
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            created_at_millis: yupNumber().defined(),
            server_metadata: yupMixed().optional().nullable(),
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
    },
  },
  '/team-permissions': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                user_id: yupString().defined(),
                team_id: yupString().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                user_id: yupString().defined(),
                team_id: yupString().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                user_id: yupString().defined(),
                team_id: yupString().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
  },
  '/team-permission-definitions': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                description: yupString().optional(),
                contained_permission_ids: yupArray(
                  yupString().defined(),
                ).defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            description: yupString().optional(),
            contained_permission_ids: yupArray(yupString().defined()).defined(),
          }).defined(),
        },
      },
    },
  },
  '/team-member-profiles': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                team_id: yupString().defined(),
                user_id: yupString().defined(),
                display_name: yupString().nullable(),
                profile_image_url: yupString().nullable(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                user: yupObject({
                  id: yupString().defined(),
                  primary_email: yupString().nullable(),
                  primary_email_verified: yupBoolean().defined(),
                  primary_email_auth_enabled: yupBoolean().defined(),
                  display_name: yupString().nullable(),
                  selected_team: yupObject({
                    created_at_millis: yupNumber().defined(),
                    server_metadata: yupMixed().optional().nullable(),
                    id: yupString().defined(),
                    display_name: yupString().defined(),
                    profile_image_url: yupString().nullable(),
                    client_metadata: yupMixed().optional().nullable(),
                    client_read_only_metadata: yupMixed().optional().nullable(),
                  }).nullable(),
                  selected_team_id: yupString().nullable(),
                  profile_image_url: yupString().nullable(),
                  signed_up_at_millis: yupNumber().defined(),
                  has_password: yupBoolean().defined(),
                  otp_auth_enabled: yupBoolean().defined(),
                  passkey_auth_enabled: yupBoolean().defined(),
                  client_metadata: yupMixed().nullable(),
                  client_read_only_metadata: yupMixed().nullable(),
                  server_metadata: yupMixed().nullable(),
                  last_active_at_millis: yupNumber().defined(),
                  oauth_providers: yupArray(
                    yupObject({
                      id: yupString().defined(),
                      account_id: yupString().defined(),
                      email: yupString().optional().nullable(),
                    }).defined(),
                  ).defined(),
                  auth_with_email: yupBoolean().defined(),
                  requires_totp_mfa: yupBoolean().defined(),
                }).defined(),
                team_id: yupString().defined(),
                user_id: yupString().defined(),
                display_name: yupString().nullable(),
                profile_image_url: yupString().nullable(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                user: yupObject({
                  id: yupString().defined(),
                  primary_email: yupString().nullable(),
                  primary_email_verified: yupBoolean().defined(),
                  primary_email_auth_enabled: yupBoolean().defined(),
                  display_name: yupString().nullable(),
                  selected_team: yupObject({
                    created_at_millis: yupNumber().defined(),
                    server_metadata: yupMixed().optional().nullable(),
                    id: yupString().defined(),
                    display_name: yupString().defined(),
                    profile_image_url: yupString().nullable(),
                    client_metadata: yupMixed().optional().nullable(),
                    client_read_only_metadata: yupMixed().optional().nullable(),
                  }).nullable(),
                  selected_team_id: yupString().nullable(),
                  profile_image_url: yupString().nullable(),
                  signed_up_at_millis: yupNumber().defined(),
                  has_password: yupBoolean().defined(),
                  otp_auth_enabled: yupBoolean().defined(),
                  passkey_auth_enabled: yupBoolean().defined(),
                  client_metadata: yupMixed().nullable(),
                  client_read_only_metadata: yupMixed().nullable(),
                  server_metadata: yupMixed().nullable(),
                  last_active_at_millis: yupNumber().defined(),
                  oauth_providers: yupArray(
                    yupObject({
                      id: yupString().defined(),
                      account_id: yupString().defined(),
                      email: yupString().optional().nullable(),
                    }).defined(),
                  ).defined(),
                  auth_with_email: yupBoolean().defined(),
                  requires_totp_mfa: yupBoolean().defined(),
                }).defined(),
                team_id: yupString().defined(),
                user_id: yupString().defined(),
                display_name: yupString().nullable(),
                profile_image_url: yupString().nullable(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
  },
  '/team-invitations': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                team_id: yupString().defined(),
                expires_at_millis: yupNumber().defined(),
                recipient_email: yupString().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                team_id: yupString().defined(),
                expires_at_millis: yupNumber().defined(),
                recipient_email: yupString().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                team_id: yupString().defined(),
                expires_at_millis: yupNumber().defined(),
                recipient_email: yupString().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
  },
  '/email-templates': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                type: yupString()
                  .defined()
                  .oneOf([
                    'email_verification',
                    'password_reset',
                    'magic_link',
                    'team_invitation',
                  ]),
                subject: yupString().defined(),
                content: yupMixed().nullable(),
                is_default: yupBoolean().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
  },
  '/contact-channels': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                user_id: yupString().defined(),
                id: yupString().defined(),
                value: yupString().defined(),
                type: yupString().defined().oneOf(['email']),
                used_for_auth: yupBoolean().defined(),
                is_verified: yupBoolean().defined(),
                is_primary: yupBoolean().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                user_id: yupString().defined(),
                id: yupString().defined(),
                value: yupString().defined(),
                type: yupString().defined().oneOf(['email']),
                used_for_auth: yupBoolean().defined(),
                is_verified: yupBoolean().defined(),
                is_primary: yupBoolean().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                user_id: yupString().defined(),
                id: yupString().defined(),
                value: yupString().defined(),
                type: yupString().defined().oneOf(['email']),
                used_for_auth: yupBoolean().defined(),
                is_verified: yupBoolean().defined(),
                is_primary: yupBoolean().defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
  },
  '/check-version': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupMixed().defined(),
        },
      },
    },
  },
  '/check-feature-support': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupString().defined(),
        },
      },
    },
  },
  '/webhooks/svix-token': {
    POST: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({ token: yupString().defined() }).defined(),
        },
      },
    },
  },
  '/users/me': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            selected_team: yupObject({
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            display_name: yupString().nullable(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            auth_with_email: yupBoolean().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            selected_team_id: yupString().nullable(),
            requires_totp_mfa: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
          }).nullable(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).nullable(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).nullable(),
        },
      },
    },
    DELETE: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            selected_team: yupObject({
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            display_name: yupString().nullable(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            auth_with_email: yupBoolean().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            selected_team_id: yupString().nullable(),
            requires_totp_mfa: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
          }).nullable(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).nullable(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).nullable(),
        },
      },
    },
  },
  '/users/[user_id]': {
    GET: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
    DELETE: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            primary_email: yupString().nullable(),
            primary_email_verified: yupBoolean().defined(),
            primary_email_auth_enabled: yupBoolean().defined(),
            display_name: yupString().nullable(),
            selected_team: yupObject({
              created_at_millis: yupNumber().defined(),
              server_metadata: yupMixed().optional().nullable(),
              id: yupString().defined(),
              display_name: yupString().defined(),
              profile_image_url: yupString().nullable(),
              client_metadata: yupMixed().optional().nullable(),
              client_read_only_metadata: yupMixed().optional().nullable(),
            }).nullable(),
            selected_team_id: yupString().nullable(),
            profile_image_url: yupString().nullable(),
            signed_up_at_millis: yupNumber().defined(),
            has_password: yupBoolean().defined(),
            otp_auth_enabled: yupBoolean().defined(),
            passkey_auth_enabled: yupBoolean().defined(),
            client_metadata: yupMixed().nullable(),
            client_read_only_metadata: yupMixed().nullable(),
            server_metadata: yupMixed().nullable(),
            last_active_at_millis: yupNumber().defined(),
            oauth_providers: yupArray(
              yupObject({
                id: yupString().defined(),
                account_id: yupString().defined(),
                email: yupString().optional().nullable(),
              }).defined(),
            ).defined(),
            auth_with_email: yupBoolean().defined(),
            requires_totp_mfa: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
  },
  '/team-permission-definitions/[permission_id]': {
    DELETE: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            description: yupString().optional(),
            contained_permission_ids: yupArray(yupString().defined()).defined(),
          }).defined(),
        },
      },
    },
  },
  '/teams/[team_id]': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            created_at_millis: yupNumber().defined(),
            server_metadata: yupMixed().optional().nullable(),
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            created_at_millis: yupNumber().defined(),
            server_metadata: yupMixed().optional().nullable(),
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
    },
    DELETE: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            created_at_millis: yupNumber().defined(),
            server_metadata: yupMixed().optional().nullable(),
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            created_at_millis: yupNumber().defined(),
            server_metadata: yupMixed().optional().nullable(),
            id: yupString().defined(),
            display_name: yupString().defined(),
            profile_image_url: yupString().nullable(),
            client_metadata: yupMixed().optional().nullable(),
            client_read_only_metadata: yupMixed().optional().nullable(),
          }).defined(),
        },
      },
    },
  },
  '/team-invitations/accept': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({}).defined(),
        },
      },
    },
  },
  '/team-invitations/[id]': {
    DELETE: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
  },
  '/projects/current': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            config: yupObject({
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            config: yupObject({
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            description: yupString().defined(),
            created_at_millis: yupNumber().defined(),
            user_count: yupNumber().defined(),
            is_production_mode: yupBoolean().defined(),
            config: yupObject({
              id: yupString().defined(),
              allow_localhost: yupBoolean().defined(),
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              legacy_global_jwt_signing: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                  enabled: yupBoolean().defined(),
                  type: yupString().defined().oneOf(['shared', 'standard']),
                  client_id: yupString().optional(),
                  client_secret: yupString().optional(),
                  facebook_config_id: yupString().optional(),
                  microsoft_tenant_id: yupString().optional(),
                }).defined(),
              ).defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
              domains: yupArray(
                yupObject({
                  domain: yupString().defined(),
                  handler_path: yupString().defined(),
                }).defined(),
              ).defined(),
              email_config: yupObject({
                type: yupString().defined().oneOf(['shared', 'standard']),
                host: yupString().optional(),
                port: yupNumber().optional(),
                username: yupString().optional(),
                password: yupString().optional(),
                sender_name: yupString().optional(),
                sender_email: yupString().optional(),
              }).defined(),
              create_team_on_sign_up: yupBoolean().defined(),
              team_creator_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
              team_member_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
    },
    DELETE: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            description: yupString().defined(),
            created_at_millis: yupNumber().defined(),
            user_count: yupNumber().defined(),
            is_production_mode: yupBoolean().defined(),
            config: yupObject({
              id: yupString().defined(),
              allow_localhost: yupBoolean().defined(),
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              legacy_global_jwt_signing: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                  enabled: yupBoolean().defined(),
                  type: yupString().defined().oneOf(['shared', 'standard']),
                  client_id: yupString().optional(),
                  client_secret: yupString().optional(),
                  facebook_config_id: yupString().optional(),
                  microsoft_tenant_id: yupString().optional(),
                }).defined(),
              ).defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
              domains: yupArray(
                yupObject({
                  domain: yupString().defined(),
                  handler_path: yupString().defined(),
                }).defined(),
              ).defined(),
              email_config: yupObject({
                type: yupString().defined().oneOf(['shared', 'standard']),
                host: yupString().optional(),
                port: yupNumber().optional(),
                username: yupString().optional(),
                password: yupString().optional(),
                sender_name: yupString().optional(),
                sender_email: yupString().optional(),
              }).defined(),
              create_team_on_sign_up: yupBoolean().defined(),
              team_creator_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
              team_member_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
    },
  },
  '/team-invitations/send-code': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            success: yupBoolean().defined().oneOf([true]),
            id: yupString().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            success: yupBoolean().defined().oneOf([true]),
            id: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            success: yupBoolean().defined().oneOf([true]),
            id: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/internal/api-keys': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                publishable_client_key: yupObject({
                  last_four: yupString().defined(),
                }).optional(),
                secret_server_key: yupObject({
                  last_four: yupString().defined(),
                }).optional(),
                super_secret_admin_key: yupObject({
                  last_four: yupString().defined(),
                }).optional(),
                id: yupString().defined(),
                description: yupString().defined(),
                expires_at_millis: yupNumber().defined(),
                manually_revoked_at_millis: yupNumber().optional(),
                created_at_millis: yupNumber().defined(),
              }).optional(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            publishable_client_key: yupString().optional(),
            secret_server_key: yupString().optional(),
            super_secret_admin_key: yupString().optional(),
            id: yupString().defined(),
            description: yupString().defined(),
            expires_at_millis: yupNumber().defined(),
            manually_revoked_at_millis: yupNumber().optional(),
            created_at_millis: yupNumber().defined(),
          }).defined(),
        },
      },
    },
  },
  '/internal/projects': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                display_name: yupString().defined(),
                description: yupString().defined(),
                created_at_millis: yupNumber().defined(),
                user_count: yupNumber().defined(),
                is_production_mode: yupBoolean().defined(),
                config: yupObject({
                  id: yupString().defined(),
                  allow_localhost: yupBoolean().defined(),
                  sign_up_enabled: yupBoolean().defined(),
                  credential_enabled: yupBoolean().defined(),
                  magic_link_enabled: yupBoolean().defined(),
                  passkey_enabled: yupBoolean().defined(),
                  legacy_global_jwt_signing: yupBoolean().defined(),
                  client_team_creation_enabled: yupBoolean().defined(),
                  client_user_deletion_enabled: yupBoolean().defined(),
                  oauth_providers: yupArray(
                    yupObject({
                      id: yupString()
                        .defined()
                        .oneOf([
                          'google',
                          'github',
                          'microsoft',
                          'spotify',
                          'facebook',
                          'discord',
                          'gitlab',
                          'bitbucket',
                          'linkedin',
                          'apple',
                          'x',
                        ]),
                      enabled: yupBoolean().defined(),
                      type: yupString().defined().oneOf(['shared', 'standard']),
                      client_id: yupString().optional(),
                      client_secret: yupString().optional(),
                      facebook_config_id: yupString().optional(),
                      microsoft_tenant_id: yupString().optional(),
                    }).defined(),
                  ).defined(),
                  enabled_oauth_providers: yupArray(
                    yupObject({
                      id: yupString()
                        .defined()
                        .oneOf([
                          'google',
                          'github',
                          'microsoft',
                          'spotify',
                          'facebook',
                          'discord',
                          'gitlab',
                          'bitbucket',
                          'linkedin',
                          'apple',
                          'x',
                        ]),
                    }).defined(),
                  ).defined(),
                  domains: yupArray(
                    yupObject({
                      domain: yupString().defined(),
                      handler_path: yupString().defined(),
                    }).defined(),
                  ).defined(),
                  email_config: yupObject({
                    type: yupString().defined().oneOf(['shared', 'standard']),
                    host: yupString().optional(),
                    port: yupNumber().optional(),
                    username: yupString().optional(),
                    password: yupString().optional(),
                    sender_name: yupString().optional(),
                    sender_email: yupString().optional(),
                  }).defined(),
                  create_team_on_sign_up: yupBoolean().defined(),
                  team_creator_default_permissions: yupArray(
                    yupObject({ id: yupString().defined() }).defined(),
                  ).defined(),
                  team_member_default_permissions: yupArray(
                    yupObject({ id: yupString().defined() }).defined(),
                  ).defined(),
                }).defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                display_name: yupString().defined(),
                description: yupString().defined(),
                created_at_millis: yupNumber().defined(),
                user_count: yupNumber().defined(),
                is_production_mode: yupBoolean().defined(),
                config: yupObject({
                  id: yupString().defined(),
                  allow_localhost: yupBoolean().defined(),
                  sign_up_enabled: yupBoolean().defined(),
                  credential_enabled: yupBoolean().defined(),
                  magic_link_enabled: yupBoolean().defined(),
                  passkey_enabled: yupBoolean().defined(),
                  legacy_global_jwt_signing: yupBoolean().defined(),
                  client_team_creation_enabled: yupBoolean().defined(),
                  client_user_deletion_enabled: yupBoolean().defined(),
                  oauth_providers: yupArray(
                    yupObject({
                      id: yupString()
                        .defined()
                        .oneOf([
                          'google',
                          'github',
                          'microsoft',
                          'spotify',
                          'facebook',
                          'discord',
                          'gitlab',
                          'bitbucket',
                          'linkedin',
                          'apple',
                          'x',
                        ]),
                      enabled: yupBoolean().defined(),
                      type: yupString().defined().oneOf(['shared', 'standard']),
                      client_id: yupString().optional(),
                      client_secret: yupString().optional(),
                      facebook_config_id: yupString().optional(),
                      microsoft_tenant_id: yupString().optional(),
                    }).defined(),
                  ).defined(),
                  enabled_oauth_providers: yupArray(
                    yupObject({
                      id: yupString()
                        .defined()
                        .oneOf([
                          'google',
                          'github',
                          'microsoft',
                          'spotify',
                          'facebook',
                          'discord',
                          'gitlab',
                          'bitbucket',
                          'linkedin',
                          'apple',
                          'x',
                        ]),
                    }).defined(),
                  ).defined(),
                  domains: yupArray(
                    yupObject({
                      domain: yupString().defined(),
                      handler_path: yupString().defined(),
                    }).defined(),
                  ).defined(),
                  email_config: yupObject({
                    type: yupString().defined().oneOf(['shared', 'standard']),
                    host: yupString().optional(),
                    port: yupNumber().optional(),
                    username: yupString().optional(),
                    password: yupString().optional(),
                    sender_name: yupString().optional(),
                    sender_email: yupString().optional(),
                  }).defined(),
                  create_team_on_sign_up: yupBoolean().defined(),
                  team_creator_default_permissions: yupArray(
                    yupObject({ id: yupString().defined() }).defined(),
                  ).defined(),
                  team_member_default_permissions: yupArray(
                    yupObject({ id: yupString().defined() }).defined(),
                  ).defined(),
                }).defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString().defined(),
                display_name: yupString().defined(),
                description: yupString().defined(),
                created_at_millis: yupNumber().defined(),
                user_count: yupNumber().defined(),
                is_production_mode: yupBoolean().defined(),
                config: yupObject({
                  id: yupString().defined(),
                  allow_localhost: yupBoolean().defined(),
                  sign_up_enabled: yupBoolean().defined(),
                  credential_enabled: yupBoolean().defined(),
                  magic_link_enabled: yupBoolean().defined(),
                  passkey_enabled: yupBoolean().defined(),
                  legacy_global_jwt_signing: yupBoolean().defined(),
                  client_team_creation_enabled: yupBoolean().defined(),
                  client_user_deletion_enabled: yupBoolean().defined(),
                  oauth_providers: yupArray(
                    yupObject({
                      id: yupString()
                        .defined()
                        .oneOf([
                          'google',
                          'github',
                          'microsoft',
                          'spotify',
                          'facebook',
                          'discord',
                          'gitlab',
                          'bitbucket',
                          'linkedin',
                          'apple',
                          'x',
                        ]),
                      enabled: yupBoolean().defined(),
                      type: yupString().defined().oneOf(['shared', 'standard']),
                      client_id: yupString().optional(),
                      client_secret: yupString().optional(),
                      facebook_config_id: yupString().optional(),
                      microsoft_tenant_id: yupString().optional(),
                    }).defined(),
                  ).defined(),
                  enabled_oauth_providers: yupArray(
                    yupObject({
                      id: yupString()
                        .defined()
                        .oneOf([
                          'google',
                          'github',
                          'microsoft',
                          'spotify',
                          'facebook',
                          'discord',
                          'gitlab',
                          'bitbucket',
                          'linkedin',
                          'apple',
                          'x',
                        ]),
                    }).defined(),
                  ).defined(),
                  domains: yupArray(
                    yupObject({
                      domain: yupString().defined(),
                      handler_path: yupString().defined(),
                    }).defined(),
                  ).defined(),
                  email_config: yupObject({
                    type: yupString().defined().oneOf(['shared', 'standard']),
                    host: yupString().optional(),
                    port: yupNumber().optional(),
                    username: yupString().optional(),
                    password: yupString().optional(),
                    sender_name: yupString().optional(),
                    sender_email: yupString().optional(),
                  }).defined(),
                  create_team_on_sign_up: yupBoolean().defined(),
                  team_creator_default_permissions: yupArray(
                    yupObject({ id: yupString().defined() }).defined(),
                  ).defined(),
                  team_member_default_permissions: yupArray(
                    yupObject({ id: yupString().defined() }).defined(),
                  ).defined(),
                }).defined(),
              }).defined(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            description: yupString().defined(),
            created_at_millis: yupNumber().defined(),
            user_count: yupNumber().defined(),
            is_production_mode: yupBoolean().defined(),
            config: yupObject({
              id: yupString().defined(),
              allow_localhost: yupBoolean().defined(),
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              legacy_global_jwt_signing: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                  enabled: yupBoolean().defined(),
                  type: yupString().defined().oneOf(['shared', 'standard']),
                  client_id: yupString().optional(),
                  client_secret: yupString().optional(),
                  facebook_config_id: yupString().optional(),
                  microsoft_tenant_id: yupString().optional(),
                }).defined(),
              ).defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
              domains: yupArray(
                yupObject({
                  domain: yupString().defined(),
                  handler_path: yupString().defined(),
                }).defined(),
              ).defined(),
              email_config: yupObject({
                type: yupString().defined().oneOf(['shared', 'standard']),
                host: yupString().optional(),
                port: yupNumber().optional(),
                username: yupString().optional(),
                password: yupString().optional(),
                sender_name: yupString().optional(),
                sender_email: yupString().optional(),
              }).defined(),
              create_team_on_sign_up: yupBoolean().defined(),
              team_creator_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
              team_member_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            description: yupString().defined(),
            created_at_millis: yupNumber().defined(),
            user_count: yupNumber().defined(),
            is_production_mode: yupBoolean().defined(),
            config: yupObject({
              id: yupString().defined(),
              allow_localhost: yupBoolean().defined(),
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              legacy_global_jwt_signing: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                  enabled: yupBoolean().defined(),
                  type: yupString().defined().oneOf(['shared', 'standard']),
                  client_id: yupString().optional(),
                  client_secret: yupString().optional(),
                  facebook_config_id: yupString().optional(),
                  microsoft_tenant_id: yupString().optional(),
                }).defined(),
              ).defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
              domains: yupArray(
                yupObject({
                  domain: yupString().defined(),
                  handler_path: yupString().defined(),
                }).defined(),
              ).defined(),
              email_config: yupObject({
                type: yupString().defined().oneOf(['shared', 'standard']),
                host: yupString().optional(),
                port: yupNumber().optional(),
                username: yupString().optional(),
                password: yupString().optional(),
                sender_name: yupString().optional(),
                sender_email: yupString().optional(),
              }).defined(),
              create_team_on_sign_up: yupBoolean().defined(),
              team_creator_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
              team_member_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            display_name: yupString().defined(),
            description: yupString().defined(),
            created_at_millis: yupNumber().defined(),
            user_count: yupNumber().defined(),
            is_production_mode: yupBoolean().defined(),
            config: yupObject({
              id: yupString().defined(),
              allow_localhost: yupBoolean().defined(),
              sign_up_enabled: yupBoolean().defined(),
              credential_enabled: yupBoolean().defined(),
              magic_link_enabled: yupBoolean().defined(),
              passkey_enabled: yupBoolean().defined(),
              legacy_global_jwt_signing: yupBoolean().defined(),
              client_team_creation_enabled: yupBoolean().defined(),
              client_user_deletion_enabled: yupBoolean().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                  enabled: yupBoolean().defined(),
                  type: yupString().defined().oneOf(['shared', 'standard']),
                  client_id: yupString().optional(),
                  client_secret: yupString().optional(),
                  facebook_config_id: yupString().optional(),
                  microsoft_tenant_id: yupString().optional(),
                }).defined(),
              ).defined(),
              enabled_oauth_providers: yupArray(
                yupObject({
                  id: yupString()
                    .defined()
                    .oneOf([
                      'google',
                      'github',
                      'microsoft',
                      'spotify',
                      'facebook',
                      'discord',
                      'gitlab',
                      'bitbucket',
                      'linkedin',
                      'apple',
                      'x',
                    ]),
                }).defined(),
              ).defined(),
              domains: yupArray(
                yupObject({
                  domain: yupString().defined(),
                  handler_path: yupString().defined(),
                }).defined(),
              ).defined(),
              email_config: yupObject({
                type: yupString().defined().oneOf(['shared', 'standard']),
                host: yupString().optional(),
                port: yupNumber().optional(),
                username: yupString().optional(),
                password: yupString().optional(),
                sender_name: yupString().optional(),
                sender_email: yupString().optional(),
              }).defined(),
              create_team_on_sign_up: yupBoolean().defined(),
              team_creator_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
              team_member_default_permissions: yupArray(
                yupObject({ id: yupString().defined() }).defined(),
              ).defined(),
            }).defined(),
          }).defined(),
        },
      },
    },
  },
  '/email-templates/[type]': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            type: yupString()
              .defined()
              .oneOf([
                'email_verification',
                'password_reset',
                'magic_link',
                'team_invitation',
              ]),
            subject: yupString().defined(),
            content: yupMixed().nullable(),
            is_default: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
    DELETE: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            type: yupString()
              .defined()
              .oneOf([
                'email_verification',
                'password_reset',
                'magic_link',
                'team_invitation',
              ]),
            subject: yupString().defined(),
            content: yupMixed().nullable(),
            is_default: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
  },
  '/contact-channels/verify': {
    POST: {
      default: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/contact-channels/send-verification-code': {
    POST: {
      client: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      server: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      admin: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/auth/sessions': {
    POST: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            refresh_token: yupString().defined(),
            access_token: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            refresh_token: yupString().defined(),
            access_token: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/team-memberships/[team_id]/[user_id]': {
    POST: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            team_id: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            team_id: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
    },
    DELETE: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
  },
  '/team-member-profiles/[team_id]/[user_id]': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            team_id: yupString().defined(),
            user_id: yupString().defined(),
            display_name: yupString().nullable(),
            profile_image_url: yupString().nullable(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user: yupObject({
              id: yupString().defined(),
              primary_email: yupString().nullable(),
              primary_email_verified: yupBoolean().defined(),
              primary_email_auth_enabled: yupBoolean().defined(),
              display_name: yupString().nullable(),
              selected_team: yupObject({
                created_at_millis: yupNumber().defined(),
                server_metadata: yupMixed().optional().nullable(),
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).nullable(),
              selected_team_id: yupString().nullable(),
              profile_image_url: yupString().nullable(),
              signed_up_at_millis: yupNumber().defined(),
              has_password: yupBoolean().defined(),
              otp_auth_enabled: yupBoolean().defined(),
              passkey_auth_enabled: yupBoolean().defined(),
              client_metadata: yupMixed().nullable(),
              client_read_only_metadata: yupMixed().nullable(),
              server_metadata: yupMixed().nullable(),
              last_active_at_millis: yupNumber().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString().defined(),
                  account_id: yupString().defined(),
                  email: yupString().optional().nullable(),
                }).defined(),
              ).defined(),
              auth_with_email: yupBoolean().defined(),
              requires_totp_mfa: yupBoolean().defined(),
            }).defined(),
            team_id: yupString().defined(),
            user_id: yupString().defined(),
            display_name: yupString().nullable(),
            profile_image_url: yupString().nullable(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user: yupObject({
              id: yupString().defined(),
              primary_email: yupString().nullable(),
              primary_email_verified: yupBoolean().defined(),
              primary_email_auth_enabled: yupBoolean().defined(),
              display_name: yupString().nullable(),
              selected_team: yupObject({
                created_at_millis: yupNumber().defined(),
                server_metadata: yupMixed().optional().nullable(),
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).nullable(),
              selected_team_id: yupString().nullable(),
              profile_image_url: yupString().nullable(),
              signed_up_at_millis: yupNumber().defined(),
              has_password: yupBoolean().defined(),
              otp_auth_enabled: yupBoolean().defined(),
              passkey_auth_enabled: yupBoolean().defined(),
              client_metadata: yupMixed().nullable(),
              client_read_only_metadata: yupMixed().nullable(),
              server_metadata: yupMixed().nullable(),
              last_active_at_millis: yupNumber().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString().defined(),
                  account_id: yupString().defined(),
                  email: yupString().optional().nullable(),
                }).defined(),
              ).defined(),
              auth_with_email: yupBoolean().defined(),
              requires_totp_mfa: yupBoolean().defined(),
            }).defined(),
            team_id: yupString().defined(),
            user_id: yupString().defined(),
            display_name: yupString().nullable(),
            profile_image_url: yupString().nullable(),
          }).defined(),
        },
      },
    },
    PATCH: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            team_id: yupString().defined(),
            user_id: yupString().defined(),
            display_name: yupString().nullable(),
            profile_image_url: yupString().nullable(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user: yupObject({
              id: yupString().defined(),
              primary_email: yupString().nullable(),
              primary_email_verified: yupBoolean().defined(),
              primary_email_auth_enabled: yupBoolean().defined(),
              display_name: yupString().nullable(),
              selected_team: yupObject({
                created_at_millis: yupNumber().defined(),
                server_metadata: yupMixed().optional().nullable(),
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).nullable(),
              selected_team_id: yupString().nullable(),
              profile_image_url: yupString().nullable(),
              signed_up_at_millis: yupNumber().defined(),
              has_password: yupBoolean().defined(),
              otp_auth_enabled: yupBoolean().defined(),
              passkey_auth_enabled: yupBoolean().defined(),
              client_metadata: yupMixed().nullable(),
              client_read_only_metadata: yupMixed().nullable(),
              server_metadata: yupMixed().nullable(),
              last_active_at_millis: yupNumber().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString().defined(),
                  account_id: yupString().defined(),
                  email: yupString().optional().nullable(),
                }).defined(),
              ).defined(),
              auth_with_email: yupBoolean().defined(),
              requires_totp_mfa: yupBoolean().defined(),
            }).defined(),
            team_id: yupString().defined(),
            user_id: yupString().defined(),
            display_name: yupString().nullable(),
            profile_image_url: yupString().nullable(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user: yupObject({
              id: yupString().defined(),
              primary_email: yupString().nullable(),
              primary_email_verified: yupBoolean().defined(),
              primary_email_auth_enabled: yupBoolean().defined(),
              display_name: yupString().nullable(),
              selected_team: yupObject({
                created_at_millis: yupNumber().defined(),
                server_metadata: yupMixed().optional().nullable(),
                id: yupString().defined(),
                display_name: yupString().defined(),
                profile_image_url: yupString().nullable(),
                client_metadata: yupMixed().optional().nullable(),
                client_read_only_metadata: yupMixed().optional().nullable(),
              }).nullable(),
              selected_team_id: yupString().nullable(),
              profile_image_url: yupString().nullable(),
              signed_up_at_millis: yupNumber().defined(),
              has_password: yupBoolean().defined(),
              otp_auth_enabled: yupBoolean().defined(),
              passkey_auth_enabled: yupBoolean().defined(),
              client_metadata: yupMixed().nullable(),
              client_read_only_metadata: yupMixed().nullable(),
              server_metadata: yupMixed().nullable(),
              last_active_at_millis: yupNumber().defined(),
              oauth_providers: yupArray(
                yupObject({
                  id: yupString().defined(),
                  account_id: yupString().defined(),
                  email: yupString().optional().nullable(),
                }).defined(),
              ).defined(),
              auth_with_email: yupBoolean().defined(),
              requires_totp_mfa: yupBoolean().defined(),
            }).defined(),
            team_id: yupString().defined(),
            user_id: yupString().defined(),
            display_name: yupString().nullable(),
            profile_image_url: yupString().nullable(),
          }).defined(),
        },
      },
    },
  },
  '/team-invitations/accept/details': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            team_id: yupString().defined(),
            team_display_name: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/team-invitations/accept/check-code': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            is_code_valid: yupBoolean().defined().oneOf([true]),
          }).defined(),
        },
      },
    },
  },
  '/internal/api-keys/[api_key_id]': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            publishable_client_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            secret_server_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            super_secret_admin_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            id: yupString().defined(),
            description: yupString().defined(),
            expires_at_millis: yupNumber().defined(),
            manually_revoked_at_millis: yupNumber().optional(),
            created_at_millis: yupNumber().defined(),
          }).optional(),
        },
      },
    },
    PATCH: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            publishable_client_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            secret_server_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            super_secret_admin_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            id: yupString().defined(),
            description: yupString().defined(),
            expires_at_millis: yupNumber().defined(),
            manually_revoked_at_millis: yupNumber().optional(),
            created_at_millis: yupNumber().defined(),
          }).optional(),
        },
      },
    },
  },
  '/integrations/neon/webhooks': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ secret: yupString().defined() }).defined(),
        },
      },
    },
  },
  '/integrations/neon/oauth-providers': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                id: yupString()
                  .defined()
                  .oneOf([
                    'google',
                    'github',
                    'microsoft',
                    'spotify',
                    'facebook',
                    'discord',
                    'gitlab',
                    'bitbucket',
                    'linkedin',
                    'apple',
                    'x',
                  ]),
                type: yupString().defined().oneOf(['shared', 'standard']),
                client_id: yupString().optional(),
                client_secret: yupString().optional(),
                facebook_config_id: yupString().optional(),
                microsoft_tenant_id: yupString().optional(),
              }).optional(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString()
              .defined()
              .oneOf([
                'google',
                'github',
                'microsoft',
                'spotify',
                'facebook',
                'discord',
                'gitlab',
                'bitbucket',
                'linkedin',
                'apple',
                'x',
              ]),
            type: yupString().defined().oneOf(['shared', 'standard']),
            client_id: yupString().optional(),
            client_secret: yupString().optional(),
            facebook_config_id: yupString().optional(),
            microsoft_tenant_id: yupString().optional(),
          }).optional(),
        },
      },
    },
  },
  '/integrations/neon/oauth': {
    GET: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupString().defined(),
        },
      },
    },
  },
  '/integrations/neon/api-keys': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            items: yupArray(
              yupObject({
                publishable_client_key: yupObject({
                  last_four: yupString().defined(),
                }).optional(),
                secret_server_key: yupObject({
                  last_four: yupString().defined(),
                }).optional(),
                super_secret_admin_key: yupObject({
                  last_four: yupString().defined(),
                }).optional(),
                id: yupString().defined(),
                description: yupString().defined(),
                expires_at_millis: yupNumber().defined(),
                manually_revoked_at_millis: yupNumber().optional(),
                created_at_millis: yupNumber().defined(),
              }).optional(),
            ).defined(),
            is_paginated: yupBoolean().defined(),
            pagination: yupObject({
              next_cursor: yupString().nullable(),
            }).optional(),
          }).defined(),
        },
      },
    },
    POST: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            id: yupString().defined(),
            description: yupString().defined(),
            expires_at_millis: yupNumber().defined(),
            manually_revoked_at_millis: yupNumber().optional(),
            created_at_millis: yupNumber().defined(),
            publishable_client_key: yupString().optional(),
            secret_server_key: yupString().optional(),
            super_secret_admin_key: yupString().optional(),
          }).defined(),
        },
      },
    },
  },
  '/contact-channels/verify/check-code': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            is_code_valid: yupBoolean().defined().oneOf([true]),
          }).defined(),
        },
      },
    },
  },
  '/contact-channels/[user_id]/[contact_channel_id]': {
    GET: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
    DELETE: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            user_id: yupString().defined(),
            id: yupString().defined(),
            value: yupString().defined(),
            type: yupString().defined().oneOf(['email']),
            used_for_auth: yupBoolean().defined(),
            is_verified: yupBoolean().defined(),
            is_primary: yupBoolean().defined(),
          }).defined(),
        },
      },
    },
  },
  '/auth/sessions/current': {
    DELETE: {
      client: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      server: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      admin: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/auth/password/update': {
    POST: {
      client: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      server: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      admin: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/auth/password/sign-up': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            access_token: yupString().defined(),
            refresh_token: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            access_token: yupString().defined(),
            refresh_token: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            access_token: yupString().defined(),
            refresh_token: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/auth/password/sign-in': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            access_token: yupString().defined(),
            refresh_token: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            access_token: yupString().defined(),
            refresh_token: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            access_token: yupString().defined(),
            refresh_token: yupString().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/auth/password/set': {
    POST: {
      client: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      server: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      admin: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/auth/password/send-reset-code': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            success: yupString()
              .defined()
              .oneOf(['maybe, only if user with e-mail exists']),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            success: yupString()
              .defined()
              .oneOf(['maybe, only if user with e-mail exists']),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            success: yupString()
              .defined()
              .oneOf(['maybe, only if user with e-mail exists']),
          }).defined(),
        },
      },
    },
  },
  '/auth/password/reset': {
    POST: {
      default: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/auth/passkey/sign-in': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            refresh_token: yupString().defined(),
            access_token: yupString().defined(),
            is_new_user: yupBoolean().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/auth/passkey/register': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ user_handle: yupString().defined() }).optional(),
        },
      },
    },
  },
  '/auth/passkey/initiate-passkey-registration': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            options_json: yupMixed().defined(),
            code: yupString().defined(),
          }).optional(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            options_json: yupMixed().defined(),
            code: yupString().defined(),
          }).optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            options_json: yupMixed().defined(),
            code: yupString().defined(),
          }).optional(),
        },
      },
    },
  },
  '/auth/passkey/initiate-passkey-authentication': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            options_json: yupMixed().defined(),
            code: yupString().defined(),
          }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            options_json: yupMixed().defined(),
            code: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            options_json: yupMixed().defined(),
            code: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/auth/otp/sign-in': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            refresh_token: yupString().defined(),
            access_token: yupString().defined(),
            is_new_user: yupBoolean().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/auth/otp/send-sign-in-code': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ nonce: yupString().defined() }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ nonce: yupString().defined() }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ nonce: yupString().defined() }).defined(),
        },
      },
    },
  },
  '/auth/oauth/token': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined(),
          headers: yupMixed().defined(),
          body: yupMixed().defined(),
        },
      },
    },
  },
  '/auth/mfa/sign-in': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            refresh_token: yupString().defined(),
            access_token: yupString().defined(),
            is_new_user: yupBoolean().defined(),
            user_id: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/team-permissions/[team_id]/[user_id]/[permission_id]': {
    POST: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            user_id: yupString().defined(),
            team_id: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString().defined(),
            user_id: yupString().defined(),
            team_id: yupString().defined(),
          }).defined(),
        },
      },
    },
    DELETE: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
  },
  '/integrations/neon/projects/provision': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            project_id: yupString().defined(),
            super_secret_admin_key: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/integrations/neon/oauth-providers/[oauth_provider_id]': {
    DELETE: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupMixed().optional(),
        },
      },
    },
    PATCH: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            id: yupString()
              .defined()
              .oneOf([
                'google',
                'github',
                'microsoft',
                'spotify',
                'facebook',
                'discord',
                'gitlab',
                'bitbucket',
                'linkedin',
                'apple',
                'x',
              ]),
            type: yupString().defined().oneOf(['shared', 'standard']),
            client_id: yupString().optional(),
            client_secret: yupString().optional(),
            facebook_config_id: yupString().optional(),
            microsoft_tenant_id: yupString().optional(),
          }).optional(),
        },
      },
    },
  },
  '/integrations/neon/oauth/token': {
    POST: {
      default: {
        input: {},
        output: {},
      },
    },
  },
  '/integrations/neon/oauth/authorize': {
    GET: {
      default: {
        input: {},
        output: {},
      },
    },
  },
  '/integrations/neon/internal/confirm': {
    POST: {
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            authorization_code: yupString().defined(),
          }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            authorization_code: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/integrations/neon/api-keys/[api_key_id]': {
    GET: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            publishable_client_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            secret_server_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            super_secret_admin_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            id: yupString().defined(),
            description: yupString().defined(),
            expires_at_millis: yupNumber().defined(),
            manually_revoked_at_millis: yupNumber().optional(),
            created_at_millis: yupNumber().defined(),
          }).optional(),
        },
      },
    },
    PATCH: {
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          headers: yupObject({}).optional(),
          body: yupObject({
            publishable_client_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            secret_server_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            super_secret_admin_key: yupObject({
              last_four: yupString().defined(),
            }).optional(),
            id: yupString().defined(),
            description: yupString().defined(),
            expires_at_millis: yupNumber().defined(),
            manually_revoked_at_millis: yupNumber().optional(),
            created_at_millis: yupNumber().defined(),
          }).optional(),
        },
      },
    },
  },
  '/contact-channels/[user_id]/[contact_channel_id]/send-verification-code': {
    POST: {
      client: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      server: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
      admin: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([200]) },
      },
    },
  },
  '/connected-accounts/[user_id]/[provider_id]/access-token': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({ access_token: yupString().defined() }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({ access_token: yupString().defined() }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([201]),
          headers: yupObject({}).optional(),
          body: yupObject({ access_token: yupString().defined() }).defined(),
        },
      },
    },
  },
  '/auth/sessions/current/refresh': {
    POST: {
      client: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ access_token: yupString().defined() }).defined(),
        },
      },
      server: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ access_token: yupString().defined() }).defined(),
        },
      },
      admin: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ access_token: yupString().defined() }).defined(),
        },
      },
    },
  },
  '/auth/otp/sign-in/check-code': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            is_code_valid: yupBoolean().defined().oneOf([true]),
          }).defined(),
        },
      },
    },
  },
  '/auth/password/reset/check-code': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            is_code_valid: yupBoolean().defined().oneOf([true]),
          }).defined(),
        },
      },
    },
  },
  '/auth/oauth/callback/[provider_id]': {
    GET: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([307]),
          headers: yupMixed().defined(),
          body: yupMixed().defined(),
        },
      },
    },
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([307]),
          headers: yupMixed().defined(),
          body: yupMixed().defined(),
        },
      },
    },
  },
  '/auth/oauth/authorize/[provider_id]': {
    GET: {
      default: {
        input: {},
        output: { statusCode: yupNumber().defined().oneOf([302]) },
      },
    },
  },
  '/integrations/neon/projects/transfer/initiate': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({
            confirmation_url: yupString().defined(),
          }).defined(),
        },
      },
    },
  },
  '/integrations/neon/oauth/idp/[[...route]]': {},
  '/integrations/neon/projects/transfer/confirm': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined().oneOf([200]),
          body: yupObject({ project_id: yupString().defined() }).defined(),
        },
      },
    },
  },
  '/auth/oauth/connected-accounts/[provider_id]/access-token': {
    POST: {
      default: {
        input: {},
        output: {
          statusCode: yupNumber().defined(),
          body: yupMixed().defined(),
        },
      },
    },
  },
};
