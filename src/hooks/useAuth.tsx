import { makeRedirectUri, revokeAsync, startAsync } from 'expo-auth-session';
import React, {
    useEffect,
    createContext,
    useContext,
    useState,
    ReactNode
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateRandom } from 'expo-auth-session/build/PKCE';

import { api } from '../services/api';

export interface User {
    id: number;
    display_name: string;
    email: string;
    profile_image_url: string;
}

interface AuthContextData {
    user: User;
    isLoggingOut: boolean;
    isLoggingIn: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

interface AuthProviderData {
    children: ReactNode;
}

const AuthContext = createContext({} as AuthContextData);

const twitchEndpoints = {
    authorization: 'https://id.twitch.tv/oauth2/authorize',
    revocation: 'https://id.twitch.tv/oauth2/revoke'
};

function AuthProvider({ children }: AuthProviderData) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [user, setUser] = useState({} as User);
    const [userToken, setUserToken] = useState('');

    const { CLIENT_ID } = process.env;
    const userDataKey = '@STREAM-DATA:twitch:user_access';
    const userTokenKey = '@STREAM-DATA:twitch:user_access_token';

    async function signIn() {
        try {
            setIsLoggingIn(true);
            // AsyncStorage.clear()

            const REDIRECT_URI = makeRedirectUri({ useProxy: true });
            const RESPONSE_TYPE = 'token';
            const SCOPE = encodeURI('openid user:read:email user:read:follows channel:edit:commercial');
            const FORCE_VERIFY = true;
            const STATE = generateRandom(30);

            const authUrl =
                twitchEndpoints.authorization +
                `?client_id=${CLIENT_ID}` +
                `&redirect_uri=${REDIRECT_URI}` +
                `&response_type=${RESPONSE_TYPE}` +
                `&scope=${SCOPE}` +
                `&force_verify=${FORCE_VERIFY}` +
                `&state=${STATE}`;

            const authResponse = await startAsync({ authUrl });

            if (
                authResponse.type === 'success' &&
                authResponse.params.error !== 'access_denied'
            ) {
                if (authResponse.params.state !== STATE) {
                    throw new Error('Invalid response');
                }

                api.defaults.headers.authorization = `Bearer ${authResponse.params.access_token}`;

                const userResponse = await api.get('/users');

                const user = userResponse.data.data[0];

                setUser({
                    id: user.id,
                    display_name: user.display_name,
                    email: user.email,
                    profile_image_url: user.profile_image_url
                });

                setUserToken(authResponse.params.access_token);

                await AsyncStorage.setItem(userDataKey, JSON.stringify(user));
                await AsyncStorage.setItem(
                    userTokenKey,
                    JSON.stringify(authResponse.params.access_token)
                );
            }
        } catch (error) {
            throw new Error('Invalid');
        } finally {
            setIsLoggingIn(false);
        }
    }

    async function signOut() {
        try {
            setIsLoggingOut(true);

            await revokeAsync(
                { token: userToken, clientId: CLIENT_ID },
                { revocationEndpoint: twitchEndpoints.revocation }
            );
        } catch (error) {
        } finally {
            setUser({} as User);
            setUserToken('');

            await AsyncStorage.multiRemove([userDataKey, userTokenKey]);

            delete api.defaults.headers.authorization;

            setIsLoggingOut(false);
        }
    }

    async function loadStorageData() {
        api.defaults.headers['Client-Id'] = CLIENT_ID;

        const userResponse = await AsyncStorage.getItem(userDataKey);
        const tokenResponse = await AsyncStorage.getItem(userTokenKey);

        if (userResponse) {
            if (tokenResponse && tokenResponse) {
                const parsedUserData = JSON.parse(userResponse);
                const parsedTokenData = JSON.parse(tokenResponse);

                setUser(parsedUserData);
                setUserToken(parsedTokenData);

                api.defaults.headers.authorization = `Bearer ${parsedTokenData}`;
            }
        } else {
        }
    }

    useEffect(() => {
        loadStorageData();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggingOut,
                isLoggingIn,
                signIn,
                signOut
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);

    return context;
}

export { AuthProvider, useAuth };