export const fetchSwagger = async (url: string, username: string, password: string): Promise<any> => {
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      console.error('failed with status code', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    throw error;
  }
};
