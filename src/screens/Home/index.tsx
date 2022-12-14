import { useTheme } from 'styled-components';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    FlatList,
    Modal,
    ActivityIndicator,
    View
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { TopGamesCard } from '../../components/TopGamesCard';
import { UsersFollowsCard } from '../../components/UsersFollowsCard';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

import {
    Container,
    Header,
    UserInfo,
    Avatar,
    UserInfoText,
    RefreshButton,
    SignOutButton,
    UserFollowedStreams,
    UserFollowedStreamsTitle,
    TopGames,
    UserInfoContainer,
    TopGamesTitle,
    UserInfoId,
    Friends,
    FriendsTitle,
    FriendsCard
} from './styles';
import { UserFollowedStreamCard } from '../../components/UserFollowedStreamCard';
import theme from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLoading } from 'expo-font';

interface UsersFollows {
    id: string;
    game_name: string;
    is_mature: string;
    language: string;
    started_at: string;
    thumbnail_url: string;
    title: string;
    type: string;
    user_id: string;
    user_login: string;
    user_name: string;
    viewer_count: string;
}

interface TopGames {
    box_art_url: string;
    id: string;
    name: string;
}

interface Friends {}

interface UserFollowedStreams {
    id: string;
    thumbnail_url: string;
    title: string;
    user_id: string;
    user_login: string;
    user_name: string;
    user_email: string;
    viewer_count: number;
}

interface UsersFollowsFormatted extends UsersFollows {
    user_avatar_url: string;
}

interface UserFollowedStreamsFormatted extends UserFollowedStreams {
    user_avatar_url: string;
}

export function Home() {
    const [usersFollows, setUsersFollows] = useState<UsersFollows[]>([]);
    const [topGames, setTopGames] = useState<TopGames[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userFollowedStreams, setUserFollowedStreams] = useState<
        UserFollowedStreamsFormatted[]
    >([]);
    const [isLoadingUserFollowedStreams, setIsLoadingUserFollowedStreams] =
        useState(true);
    const [isLoadingTopGames, setIsLoadingTopGames] = useState(true);
    const [isLoadingUsersFollows, setIsLoadingUsersFollows] = useState(true);

    const theme = useTheme();
    const { signOut, user, isLoggingOut } = useAuth();

    async function handleSignOut() {
        try {
            await signOut();
        } catch (error) {
            Alert.alert('Erro SignOut', 'Ocorreu um erro ao sair');
        }
    }

    async function getTopGames() {
        try {
            const response = await api.get('/games/top');

            setTopGames(response.data.data);
            setIsLoadingTopGames(false);
        } catch (error) {
            Alert.alert(
                'Erro Top Games',
                'Ocorreu um erro ao buscar os jogos mais assistidos agora na Twitch'
            );
        }
    }

    async function getUserFollowedStreamsAvatar(
        userFollowedStreamsData: UserFollowedStreams[]
    ) {
        return Promise.all(
            userFollowedStreamsData.map(async (item) => {
                try {
                    const response = await api.get(`/users?id=${item.user_id}`);

                    return {
                        ...item,
                        user_avatar_url: response.data.data[0].profile_image_url
                    };
                } catch (error) {
                    return {
                        ...item,
                        user_avatar_url:
                            'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png'
                    };
                }
            })
        );
    }

    async function getUsersFollows() {
        try {
            const response = await api.get<{ data: UsersFollows[] }>(
                `/users/follows?to_id=${user.id}`
            );

            setUsersFollows(response.data.data);
            setIsLoadingUsersFollows(false);
            console.log(usersFollows);
        } catch (error) {
            console.log(error);
            Alert.alert(
                'Erro Commercial',
                'Não foi possível carregar commercial'
            );
        }
    }

    async function getUserFollowedStreams() {
        try {
            const response = await api.get<{ data: UserFollowedStreams[] }>(
                `/streams/followed?user_id=${user.id}`
            );

            const formattedResponse = await getUserFollowedStreamsAvatar(
                response.data.data
            );

            if (formattedResponse) {
                setUserFollowedStreams(formattedResponse);
                setIsLoadingUserFollowedStreams(false);
            }
        } catch (error) {
            console.log(error);
            AsyncStorage.clear();
            Alert.alert(
                'Erro User Followed Streams',
                'Ocorreu um erro ao buscar as informações das streams ao vivo que o usuário segue'
            );
        }
    }

    function handleLoadData() {
        setIsLoading(true);
        getTopGames();
        getUserFollowedStreams();
        setIsLoading(false);
        getUsersFollows();
    }

    useEffect(() => {
        handleLoadData();
    }, []);

    return (
        <Container
            from={{
                opacity: 0,
                scale: 0.9
            }}
            animate={{
                opacity: 1,
                scale: 1
            }}
            exit={{
                opacity: 0,
                scale: 0.9
            }}
        >
            <Header>
                <UserInfo>
                    <Avatar source={{ uri: user.profile_image_url }} />

                    <UserInfoContainer>
                        <View style={{ flexDirection: 'row' }}>
                            <UserInfoText>Olá, </UserInfoText>
                            <UserInfoText
                                style={{ fontFamily: theme.fonts.bold }}
                            >
                                {user.display_name}
                            </UserInfoText>
                        </View>
                        <UserInfoId>ID: {user.id}</UserInfoId>
                    </UserInfoContainer>
                </UserInfo>

                <View style={{ flexDirection: 'row' }}>
                    <RefreshButton onPress={handleLoadData}>
                        {isLoading ? (
                            <ActivityIndicator
                                size={25}
                                color={theme.colors.white}
                            />
                        ) : (
                            <Feather
                                name="refresh-cw"
                                size={24}
                                color={theme.colors.white}
                            />
                        )}
                    </RefreshButton>
                    <SignOutButton onPress={handleSignOut}>
                        {isLoggingOut ? (
                            <ActivityIndicator
                                size={25}
                                color={theme.colors.white}
                            />
                        ) : (
                            <Feather
                                name="power"
                                size={24}
                                color={theme.colors.white}
                            />
                        )}
                    </SignOutButton>
                </View>
            </Header>

            <ScrollView>
                <>
                    <UserFollowedStreams>
                        {userFollowedStreams.length > 0 && (
                            <UserFollowedStreamsTitle>
                                Canais que você segue{' '}
                                {userFollowedStreams.length > 0 &&
                                    `(${userFollowedStreams.length})`}
                            </UserFollowedStreamsTitle>
                        )}

                        <FlatList
                            data={
                                !isLoadingUserFollowedStreams
                                    ? userFollowedStreams
                                    : [
                                          {
                                              id: '1'
                                          } as UserFollowedStreamsFormatted,
                                          {
                                              id: '2'
                                          } as UserFollowedStreamsFormatted
                                      ]
                            }
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            maxToRenderPerBatch={4}
                            initialNumToRender={4}
                            getItemLayout={(_, index) => ({
                                length: 276,
                                offset: 276 * index,
                                index
                            })}
                            contentContainerStyle={{
                                paddingLeft: 24,
                                paddingRight: 12
                            }}
                            renderItem={({ item }) => (
                                <UserFollowedStreamCard
                                    avatarUrl={item.user_avatar_url}
                                    streamer_login={item.user_login}
                                    streamer_name={item.user_name}
                                    thumbnailUrl={item.thumbnail_url}
                                    title={item.title}
                                    viewersCount={item.viewer_count}
                                    isLoadingUserFollowedStreams={
                                        isLoadingUserFollowedStreams
                                    }
                                />
                            )}
                        />
                    </UserFollowedStreams>

                    <TopGames>
                        <TopGamesTitle>
                            Mais assistidos do momento{' '}
                            {topGames.length > 0 && `(${topGames.length})`}
                        </TopGamesTitle>

                        <FlatList
                            data={
                                !isLoadingTopGames
                                    ? topGames
                                    : [
                                          { id: '1' } as TopGames,
                                          { id: '2' } as TopGames,
                                          { id: '3' } as TopGames
                                      ]
                            }
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            maxToRenderPerBatch={5}
                            initialNumToRender={5}
                            getItemLayout={(_, index) => ({
                                length: 166,
                                offset: 166 * index,
                                index
                            })}
                            contentContainerStyle={{
                                paddingLeft: 24,
                                paddingRight: 8
                            }}
                            renderItem={({ item }) => (
                                <TopGamesCard
                                    key={item.id}
                                    url={item.box_art_url}
                                    name={item.name}
                                    isLoadingTopGames={isLoadingTopGames}
                                />
                            )}
                        />
                    </TopGames>

                    <TopGames>
                        {usersFollows.length > 0 && (
                            <TopGamesTitle>
                                Seus seguidores
                                {usersFollows.length > 0 &&
                                    `(${usersFollows.length})`}
                            </TopGamesTitle>
                        )}

                        <FlatList
                            data={
                                !isLoadingUsersFollows
                                    ? usersFollows
                                    : [
                                          { id: '1' } as UsersFollowsFormatted,
                                          { id: '2' } as UsersFollowsFormatted,
                                          { id: '3' } as UsersFollowsFormatted
                                      ]
                            }
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            maxToRenderPerBatch={5}
                            initialNumToRender={5}
                            getItemLayout={(_, index) => ({
                                length: 166,
                                offset: 166 * index,
                                index
                            })}
                            contentContainerStyle={{
                                paddingLeft: 24,
                                paddingRight: 8
                            }}
                            renderItem={({ item }) => (
                                <UsersFollowsCard
                                    key={item.id}
                                    url={item.thumbnail_url}
                                    name={item.user_name}
                                    isLoadingUsersFollows={
                                        isLoadingUsersFollows
                                    }
                                />
                            )}
                        />
                    </TopGames>
                </>
            </ScrollView>

            <Modal
                animationType="fade"
                visible={isLoggingOut}
                statusBarTranslucent
                transparent
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(14, 14, 16, 0.5)'
                    }}
                />
            </Modal>
        </Container>
    );
}